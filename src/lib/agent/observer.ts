// ============================================
// AGENT OBSERVER - Signal Collection
// ============================================

import { supabase } from '@/lib/supabase';
import { agentState } from './state';
import type {
  Signal,
  Observation,
  SupportTicket,
  MerchantApiLog,
  WebhookLog,
  CheckoutSession,
  AgentPattern,
  IncidentSeverity
} from './types';

interface ObserverConfig {
  signalWindow: number; // Time window in minutes to look back
  batchSize: number;    // Max signals per observation
  anomalyThreshold: number; // Threshold for anomaly detection
}

const DEFAULT_CONFIG: ObserverConfig = {
  signalWindow: 15,
  batchSize: 100,
  anomalyThreshold: 2.0, // 2 standard deviations
};

class AgentObserver {
  private config: ObserverConfig;

  constructor(config: Partial<ObserverConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Main observation method - collects all signals
  async observe(): Promise<Observation> {
    const windowStart = new Date(
      Date.now() - this.config.signalWindow * 60 * 1000
    ).toISOString();

    // Collect signals from all sources in parallel
    const [tickets, apiErrors, webhookFailures, checkoutFailures] = await Promise.all([
      this.collectTicketSignals(windowStart),
      this.collectApiErrorSignals(windowStart),
      this.collectWebhookFailureSignals(windowStart),
      this.collectCheckoutFailureSignals(windowStart),
    ]);

    const allSignals = [
      ...tickets,
      ...apiErrors,
      ...webhookFailures,
      ...checkoutFailures,
    ].slice(0, this.config.batchSize);

    // Detect patterns and anomalies
    const patterns = await this.detectPatterns(allSignals);
    const anomalies = this.detectAnomalies(allSignals);

    // Generate summary
    const summary = this.generateSummary(allSignals, patterns, anomalies);

    const observation: Observation = {
      signals: allSignals,
      patterns_detected: patterns,
      anomalies,
      summary,
      timestamp: new Date().toISOString(),
    };

    // Update agent state
    agentState.setObservation(observation);

    return observation;
  }

  // ============================================
  // SIGNAL COLLECTORS
  // ============================================

  private async collectTicketSignals(since: string): Promise<Signal[]> {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !tickets) return [];

    return tickets.map((ticket: SupportTicket) => ({
      id: ticket.id,
      type: 'ticket' as const,
      source: 'support_tickets',
      merchant_id: ticket.merchant_id,
      severity: this.ticketPriorityToSeverity(ticket.priority),
      message: `[${ticket.category || 'unknown'}] ${ticket.subject}`,
      data: {
        subject: ticket.subject,
        body: ticket.body,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        source: ticket.source,
      },
      timestamp: ticket.created_at,
    }));
  }

  private async collectApiErrorSignals(since: string): Promise<Signal[]> {
    const { data: logs, error } = await supabase
      .from('merchant_api_logs')
      .select('*')
      .gte('created_at', since)
      .gte('status_code', 400)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !logs) return [];

    return logs.map((log: MerchantApiLog) => ({
      id: log.id,
      type: 'api_error' as const,
      source: 'merchant_api_logs',
      merchant_id: log.merchant_id,
      severity: this.statusCodeToSeverity(log.status_code),
      message: `${log.method} ${log.endpoint} returned ${log.status_code}`,
      data: {
        endpoint: log.endpoint,
        method: log.method,
        status_code: log.status_code,
        error_message: log.error_message,
        duration_ms: log.duration_ms,
      },
      timestamp: log.created_at,
    }));
  }

  private async collectWebhookFailureSignals(since: string): Promise<Signal[]> {
    const { data: logs, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .gte('created_at', since)
      .eq('delivery_status', 'failed')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !logs) return [];

    return logs.map((log: WebhookLog) => ({
      id: log.id,
      type: 'webhook_failure' as const,
      source: 'webhook_logs',
      merchant_id: log.merchant_id,
      severity: log.retry_count >= 3 ? 'error' : 'warning',
      message: `Webhook ${log.event_type} failed (${log.retry_count} retries)`,
      data: {
        event_type: log.event_type,
        retry_count: log.retry_count,
        last_error: log.last_error,
      },
      timestamp: log.created_at,
    }));
  }

  private async collectCheckoutFailureSignals(since: string): Promise<Signal[]> {
    const { data: sessions, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .gte('created_at', since)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !sessions) return [];

    return sessions.map((session: CheckoutSession) => ({
      id: session.id,
      type: 'checkout_failure' as const,
      source: 'checkout_sessions',
      merchant_id: session.merchant_id,
      severity: 'error' as const,
      message: `Checkout failed: ${session.failure_reason || 'Unknown error'}`,
      data: {
        cart_total: session.cart_total,
        failure_reason: session.failure_reason,
        error_code: session.error_code,
        customer_email: session.customer_email,
      },
      timestamp: session.created_at,
    }));
  }

  // ============================================
  // PATTERN DETECTION
  // ============================================

  private async detectPatterns(signals: Signal[]): Promise<AgentPattern[]> {
    const patterns: AgentPattern[] = [];

    // Group signals by type and look for patterns
    const byType = this.groupBy(signals, 'type');
    const byMerchant = this.groupBy(signals, 'merchant_id');

    // Detect repeated errors from same merchant
    for (const [merchantId, merchantSignals] of Object.entries(byMerchant)) {
      if (merchantId && merchantSignals.length >= 3) {
        const errorSignals = merchantSignals.filter(s =>
          s.severity === 'error' || s.severity === 'critical'
        );

        if (errorSignals.length >= 3) {
          patterns.push({
            id: `pattern-merchant-${merchantId}`,
            pattern_type: 'repeated_merchant_errors',
            pattern_signature: {
              merchant_id: merchantId,
              error_count: errorSignals.length,
              error_types: [...new Set(errorSignals.map(s => s.type))],
            },
            description: `Merchant ${merchantId} has ${errorSignals.length} errors in the last ${this.config.signalWindow} minutes`,
            occurrences: 1,
            last_seen_at: new Date().toISOString(),
            associated_root_cause: null,
            confidence: null,
            active: true,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // Detect API endpoint issues (same endpoint failing for multiple merchants)
    const apiErrors = byType['api_error'] || [];
    const byEndpoint = this.groupBy(apiErrors, (s) => s.data.endpoint as string);

    for (const [endpoint, endpointSignals] of Object.entries(byEndpoint)) {
      const uniqueMerchants = new Set(endpointSignals.map(s => s.merchant_id));

      if (uniqueMerchants.size >= 2) {
        patterns.push({
          id: `pattern-endpoint-${endpoint}`,
          pattern_type: 'endpoint_widespread_failure',
          pattern_signature: {
            endpoint,
            affected_merchants: [...uniqueMerchants],
            failure_count: endpointSignals.length,
          },
          description: `Endpoint ${endpoint} is failing for ${uniqueMerchants.size} merchants`,
          occurrences: 1,
          last_seen_at: new Date().toISOString(),
          associated_root_cause: 'platform_regression',
          confidence: 0.7,
          active: true,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Detect checkout failure spikes
    const checkoutFailures = byType['checkout_failure'] || [];
    if (checkoutFailures.length >= 5) {
      const uniqueMerchants = new Set(checkoutFailures.map(s => s.merchant_id));

      patterns.push({
        id: 'pattern-checkout-spike',
        pattern_type: 'checkout_failure_spike',
        pattern_signature: {
          failure_count: checkoutFailures.length,
          affected_merchants: [...uniqueMerchants],
          error_codes: [...new Set(checkoutFailures.map(s => s.data.error_code))],
        },
        description: `Checkout failure spike: ${checkoutFailures.length} failures across ${uniqueMerchants.size} merchants`,
        occurrences: 1,
        last_seen_at: new Date().toISOString(),
        associated_root_cause: null,
        confidence: null,
        active: true,
        created_at: new Date().toISOString(),
      });
    }

    return patterns;
  }

  // ============================================
  // ANOMALY DETECTION
  // ============================================

  private detectAnomalies(signals: Signal[]): Observation['anomalies'] {
    const anomalies: Observation['anomalies'] = [];

    // Group by severity
    const criticalSignals = signals.filter(s => s.severity === 'critical');
    const errorSignals = signals.filter(s => s.severity === 'error');

    // Critical signals are always anomalies
    if (criticalSignals.length > 0) {
      const affectedMerchants = [...new Set(criticalSignals.map(s => s.merchant_id).filter(Boolean))];
      anomalies.push({
        type: 'critical_errors',
        description: `${criticalSignals.length} critical errors detected`,
        affected_merchants: affectedMerchants as string[],
        severity: 'critical',
      });
    }

    // High error volume is an anomaly
    if (errorSignals.length >= 10) {
      const affectedMerchants = [...new Set(errorSignals.map(s => s.merchant_id).filter(Boolean))];
      anomalies.push({
        type: 'error_volume_spike',
        description: `Unusually high error volume: ${errorSignals.length} errors in ${this.config.signalWindow} minutes`,
        affected_merchants: affectedMerchants as string[],
        severity: 'high',
      });
    }

    // Many merchants affected at once
    const uniqueMerchants = new Set(signals.map(s => s.merchant_id).filter(Boolean));
    if (uniqueMerchants.size >= 5) {
      anomalies.push({
        type: 'widespread_impact',
        description: `Issues affecting ${uniqueMerchants.size} merchants simultaneously`,
        affected_merchants: [...uniqueMerchants] as string[],
        severity: 'high',
      });
    }

    return anomalies;
  }

  // ============================================
  // HELPERS
  // ============================================

  private ticketPriorityToSeverity(priority: string): Signal['severity'] {
    switch (priority) {
      case 'urgent': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  }

  private statusCodeToSeverity(statusCode: number | null): Signal['severity'] {
    if (!statusCode) return 'warning';
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'error';
    return 'warning';
  }

  private groupBy<T>(items: T[], keyOrFn: string | ((item: T) => string)): Record<string, T[]> {
    return items.reduce((acc, item) => {
      const key = typeof keyOrFn === 'function'
        ? keyOrFn(item)
        : (item as Record<string, unknown>)[keyOrFn] as string;

      if (!key) return acc;

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  private generateSummary(
    signals: Signal[],
    patterns: AgentPattern[],
    anomalies: Observation['anomalies']
  ): string {
    const parts: string[] = [];

    if (signals.length === 0) {
      return 'No new signals detected in the observation window.';
    }

    parts.push(`Observed ${signals.length} signals`);

    const byType = this.groupBy(signals, 'type');
    const typeCounts = Object.entries(byType)
      .map(([type, items]) => `${items.length} ${type.replace('_', ' ')}s`)
      .join(', ');
    parts.push(`(${typeCounts})`);

    if (patterns.length > 0) {
      parts.push(`Detected ${patterns.length} pattern(s)`);
    }

    if (anomalies.length > 0) {
      const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
      if (criticalAnomalies.length > 0) {
        parts.push(`⚠️ ${criticalAnomalies.length} critical anomaly(ies) require attention`);
      }
    }

    return parts.join('. ') + '.';
  }
}

// Export singleton instance
export const observer = new AgentObserver();

// Export for custom configuration
export { AgentObserver };
