// ============================================
// AGENT REASONER - LLM-Powered Analysis
// ============================================

import { supabase } from '@/lib/supabase';
import { agentState } from './state';
import Anthropic from '@anthropic-ai/sdk';
import type {
  Observation,
  ReasoningResult,
  ReasoningLog,
  IncidentType,
  Evidence,
  Signal,
  AgentPattern
} from './types';

interface ReasonerConfig {
  modelId: string;
  maxTokens: number;
  temperature: number;
}

const DEFAULT_CONFIG: ReasonerConfig = {
  modelId: 'claude-3-5-sonnet-20241022',
  maxTokens: 4096,
  temperature: 0.3,
};

// Classification prompt for root cause analysis
const CLASSIFICATION_PROMPT = `You are an expert support agent for an e-commerce SaaS platform that is migrating merchants from a hosted solution to a headless architecture.

Analyze the following signals and patterns to identify the root cause of any issues.

SIGNAL CATEGORIES:
1. MIGRATION_MISSTEP: Issue started post-migration, affects specific migration batch, API/webhook configuration issues
2. PLATFORM_REGRESSION: Affects multiple merchants simultaneously, correlates with recent deployment, code-level bug
3. DOCUMENTATION_GAP: Repeated tickets with same question, correct setup but wrong expectation, missing or unclear docs
4. CONFIG_ERROR: Single merchant affected, setup deviation from standard, missing credentials or misconfiguration
5. PAYMENT_ISSUE: Stripe-related failures, payment processing errors, checkout flow problems
6. API_OUTAGE: Widespread API failures, timeouts, service unavailability

For each issue cluster, provide:
1. Classification (one of the categories above)
2. Root cause hypothesis
3. Confidence level (0-1)
4. Evidence supporting your conclusion
5. Affected scope (merchants, features)
6. Recommended priority (low, medium, high, critical)

Respond in JSON format.`;

class AgentReasoner {
  private config: ReasonerConfig;

  constructor(config: Partial<ReasonerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Main reasoning method
  async reason(observation: Observation): Promise<ReasoningResult[]> {
    const results: ReasoningResult[] = [];
    const reasoningLogs: ReasoningLog[] = [];
    let stepNumber = 0;

    // Step 1: Initial analysis
    stepNumber++;
    reasoningLogs.push({
      id: crypto.randomUUID(),
      incident_id: null,
      ticket_id: null,
      action_id: null,
      step_number: stepNumber,
      phase: 'reason',
      thought: `Analyzing ${observation.signals.length} signals and ${observation.patterns_detected.length} patterns`,
      evidence: { signal_count: observation.signals.length, pattern_count: observation.patterns_detected.length },
      conclusion: null,
      confidence: null,
      tokens_used: null,
      model_used: null,
      duration_ms: null,
      created_at: new Date().toISOString(),
    });

    // If no significant signals, return early
    if (observation.signals.length === 0 && observation.anomalies.length === 0) {
      return [];
    }

    // Step 2: Cluster related signals
    stepNumber++;
    const clusters = this.clusterSignals(observation.signals, observation.patterns_detected);
    reasoningLogs.push({
      id: crypto.randomUUID(),
      incident_id: null,
      ticket_id: null,
      action_id: null,
      step_number: stepNumber,
      phase: 'reason',
      thought: `Identified ${clusters.length} distinct issue clusters`,
      evidence: { clusters: clusters.map(c => ({ size: c.signals.length, types: c.types })) },
      conclusion: null,
      confidence: null,
      tokens_used: null,
      model_used: null,
      duration_ms: null,
      created_at: new Date().toISOString(),
    });

    // Step 3: Analyze each cluster
    for (const cluster of clusters) {
      stepNumber++;
      const startTime = Date.now();

      try {
        const analysis = await this.analyzeCluster(cluster);
        const duration = Date.now() - startTime;

        reasoningLogs.push({
          id: crypto.randomUUID(),
          incident_id: null,
          ticket_id: null,
          action_id: null,
          step_number: stepNumber,
          phase: 'reason',
          thought: `Analyzed cluster: ${analysis.classification}`,
          evidence: {
            cluster_size: cluster.signals.length,
            classification: analysis.classification,
            confidence: analysis.confidence,
          },
          conclusion: analysis.root_cause_hypothesis,
          confidence: analysis.confidence,
          tokens_used: analysis.tokens_used,
          model_used: this.config.modelId,
          duration_ms: duration,
          created_at: new Date().toISOString(),
        });

        // Build evidence chain
        const evidenceChain: Evidence[] = cluster.signals.map(signal => ({
          type: signal.type,
          source_id: signal.id,
          description: signal.message,
          timestamp: signal.timestamp,
          data: signal.data,
        }));

        // Create reasoning result
        const result: ReasoningResult = {
          incident_id: null, // Will be assigned when incident is created
          classification: analysis.classification,
          root_cause_hypothesis: analysis.root_cause_hypothesis,
          confidence: analysis.confidence,
          evidence_chain: evidenceChain,
          affected_scope: {
            merchants: [...new Set(cluster.signals.map(s => s.merchant_id).filter(Boolean))] as string[],
            features: analysis.affected_features,
            estimated_impact: analysis.impact_assessment,
          },
          reasoning_steps: reasoningLogs.filter(l => l.step_number <= stepNumber),
        };

        results.push(result);

        // Update agent state
        agentState.setReasoning(result);

      } catch (error) {
        console.error('Error analyzing cluster:', error);
        reasoningLogs.push({
          id: crypto.randomUUID(),
          incident_id: null,
          ticket_id: null,
          action_id: null,
          step_number: stepNumber,
          phase: 'reason',
          thought: `Error analyzing cluster: ${error instanceof Error ? error.message : 'Unknown error'}`,
          evidence: { error: String(error) },
          conclusion: 'Analysis failed',
          confidence: 0,
          tokens_used: null,
          model_used: null,
          duration_ms: Date.now() - startTime,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Save reasoning logs to database
    await this.saveReasoningLogs(reasoningLogs);

    return results;
  }

  // ============================================
  // SIGNAL CLUSTERING
  // ============================================

  private clusterSignals(
    signals: Signal[],
    patterns: AgentPattern[]
  ): Array<{ signals: Signal[]; types: string[]; pattern?: AgentPattern }> {
    const clusters: Array<{ signals: Signal[]; types: string[]; pattern?: AgentPattern }> = [];

    // First, create clusters based on detected patterns
    for (const pattern of patterns) {
      const signature = pattern.pattern_signature as Record<string, unknown>;
      let matchingSignals: Signal[] = [];

      if (signature.merchant_id) {
        matchingSignals = signals.filter(s => s.merchant_id === signature.merchant_id);
      } else if (signature.endpoint) {
        matchingSignals = signals.filter(s => s.data.endpoint === signature.endpoint);
      } else if (signature.affected_merchants && Array.isArray(signature.affected_merchants)) {
        matchingSignals = signals.filter(s =>
          s.merchant_id && (signature.affected_merchants as string[]).includes(s.merchant_id)
        );
      }

      if (matchingSignals.length > 0) {
        clusters.push({
          signals: matchingSignals,
          types: [...new Set(matchingSignals.map(s => s.type))],
          pattern,
        });
      }
    }

    // Then, cluster remaining signals by type and severity
    const clusteredIds = new Set(clusters.flatMap(c => c.signals.map(s => s.id)));
    const unclustered = signals.filter(s => !clusteredIds.has(s.id));

    // Group critical and error signals
    const criticalSignals = unclustered.filter(s => s.severity === 'critical' || s.severity === 'error');
    if (criticalSignals.length > 0) {
      clusters.push({
        signals: criticalSignals,
        types: [...new Set(criticalSignals.map(s => s.type))],
      });
    }

    return clusters;
  }

  // ============================================
  // LLM ANALYSIS
  // ============================================

  private async analyzeCluster(cluster: { signals: Signal[]; types: string[]; pattern?: AgentPattern }): Promise<{
    classification: IncidentType;
    root_cause_hypothesis: string;
    confidence: number;
    affected_features: string[];
    impact_assessment: string;
    tokens_used: number;
  }> {
    // Build context for LLM
    const context = this.buildAnalysisContext(cluster);

    // Use intelligent rule-based analysis
    const analysis = this.ruleBasedAnalysis(cluster);
    return {
      ...analysis,
      tokens_used: 0,
    };
  }

  private async claudeAnalysis(
    cluster: { signals: Signal[]; types: string[]; pattern?: AgentPattern },
    context: string
  ): Promise<{
    classification: IncidentType;
    root_cause_hypothesis: string;
    confidence: number;
    affected_features: string[];
    impact_assessment: string;
    tokens_used: number;
  }> {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const prompt = `${CLASSIFICATION_PROMPT}

${context}

Analyze the signals and patterns above. Respond with a JSON object containing:
{
  "classification": "migration_misstep" | "platform_regression" | "documentation_gap" | "config_error" | "payment_issue" | "api_outage",
  "root_cause_hypothesis": "string",
  "confidence": 0.0-1.0,
  "affected_features": ["string"],
  "impact_assessment": "string"
}`;

    const response = await anthropic.messages.create({
      model: this.config.modelId,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      classification: analysis.classification as IncidentType,
      root_cause_hypothesis: analysis.root_cause_hypothesis,
      confidence: analysis.confidence,
      affected_features: analysis.affected_features,
      impact_assessment: analysis.impact_assessment,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  private buildAnalysisContext(cluster: { signals: Signal[]; types: string[]; pattern?: AgentPattern }): string {
    const lines: string[] = [
      '## Signals',
      '',
    ];

    for (const signal of cluster.signals.slice(0, 20)) {
      lines.push(`- [${signal.type}] ${signal.message}`);
      lines.push(`  Merchant: ${signal.merchant_id || 'Unknown'}`);
      lines.push(`  Severity: ${signal.severity}`);
      lines.push(`  Time: ${signal.timestamp}`);
      lines.push('');
    }

    if (cluster.pattern) {
      lines.push('## Detected Pattern');
      lines.push(`Type: ${cluster.pattern.pattern_type}`);
      lines.push(`Description: ${cluster.pattern.description}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  // Rule-based analysis as fallback/demo (replace with LLM in production)
  private ruleBasedAnalysis(cluster: { signals: Signal[]; types: string[]; pattern?: AgentPattern }): {
    classification: IncidentType;
    root_cause_hypothesis: string;
    confidence: number;
    affected_features: string[];
    impact_assessment: string;
  } {
    const signals = cluster.signals;
    const pattern = cluster.pattern;
    const types = cluster.types;

    // Check for pattern-based classification
    if (pattern) {
      if (pattern.pattern_type === 'endpoint_widespread_failure') {
        return {
          classification: 'platform_regression',
          root_cause_hypothesis: `API endpoint ${(pattern.pattern_signature as Record<string, unknown>).endpoint} is experiencing widespread failures, likely due to a recent code change or infrastructure issue.`,
          confidence: 0.85,
          affected_features: ['API', 'Checkout'],
          impact_assessment: `${(pattern.pattern_signature as Record<string, unknown>).affected_merchants?.length || 'Multiple'} merchants affected`,
        };
      }

      if (pattern.pattern_type === 'checkout_failure_spike') {
        return {
          classification: 'payment_issue',
          root_cause_hypothesis: 'Checkout failures are spiking, potentially due to Stripe configuration issues or payment processing errors.',
          confidence: 0.75,
          affected_features: ['Checkout', 'Payments'],
          impact_assessment: 'Revenue-impacting issue affecting multiple merchants',
        };
      }

      if (pattern.pattern_type === 'repeated_merchant_errors') {
        return {
          classification: 'config_error',
          root_cause_hypothesis: `Single merchant experiencing repeated errors, likely due to misconfiguration during migration or missing setup steps.`,
          confidence: 0.8,
          affected_features: types.map(t => t.replace('_', ' ')),
          impact_assessment: 'Single merchant affected',
        };
      }
    }

    // Type-based classification
    if (types.includes('webhook_failure')) {
      const uniqueMerchants = new Set(signals.map(s => s.merchant_id));
      if (uniqueMerchants.size > 1) {
        return {
          classification: 'platform_regression',
          root_cause_hypothesis: 'Webhook delivery system may have an issue affecting multiple merchants.',
          confidence: 0.7,
          affected_features: ['Webhooks', 'Order Processing'],
          impact_assessment: `${uniqueMerchants.size} merchants affected`,
        };
      } else {
        return {
          classification: 'config_error',
          root_cause_hypothesis: 'Webhook endpoint may be misconfigured or unreachable for this merchant.',
          confidence: 0.75,
          affected_features: ['Webhooks'],
          impact_assessment: 'Single merchant affected',
        };
      }
    }

    if (types.includes('checkout_failure')) {
      return {
        classification: 'payment_issue',
        root_cause_hypothesis: 'Checkout failures detected, could be Stripe integration or cart processing issue.',
        confidence: 0.65,
        affected_features: ['Checkout', 'Payments'],
        impact_assessment: 'Revenue at risk',
      };
    }

    if (types.includes('ticket')) {
      // Look for migration-related keywords
      const migrationKeywords = ['migration', 'headless', 'api key', 'webhook', 'used to work'];
      const hasMigrationContext = signals.some(s =>
        migrationKeywords.some(kw =>
          s.message.toLowerCase().includes(kw) ||
          JSON.stringify(s.data).toLowerCase().includes(kw)
        )
      );

      if (hasMigrationContext) {
        return {
          classification: 'migration_misstep',
          root_cause_hypothesis: 'Issues appear related to the migration process. Merchant may have missed configuration steps.',
          confidence: 0.7,
          affected_features: ['Migration', 'Configuration'],
          impact_assessment: 'Migration-related issues',
        };
      }
    }

    // Default classification
    return {
      classification: 'documentation_gap',
      root_cause_hypothesis: 'Unable to determine specific root cause. May require manual investigation.',
      confidence: 0.3,
      affected_features: types,
      impact_assessment: 'Requires investigation',
    };
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  private async saveReasoningLogs(logs: ReasoningLog[]): Promise<void> {
    if (logs.length === 0) return;

    const { error } = await supabase
      .from('reasoning_logs')
      .insert(logs);

    if (error) {
      console.error('Failed to save reasoning logs:', error);
    }
  }
}

// Export singleton instance
export const reasoner = new AgentReasoner();

// Export for custom configuration
export { AgentReasoner };
