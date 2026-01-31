// ============================================
// AGENT TYPE DEFINITIONS
// ============================================

// Merchant Types
export interface Merchant {
  id: string;
  user_id: string | null;
  store_name: string;
  store_slug: string;
  email: string;
  phone: string | null;
  logo_url: string | null;
  status: 'active' | 'suspended' | 'migrating' | 'onboarding';
  migration_status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  migration_stage: number;
  migration_started_at: string | null;
  migration_completed_at: string | null;
  api_key_configured: boolean;
  webhook_configured: boolean;
  stripe_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchantApiLog {
  id: string;
  merchant_id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  error_message: string | null;
  request_body: Record<string, unknown> | null;
  response_body: Record<string, unknown> | null;
  duration_ms: number | null;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  merchant_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  delivery_status: 'pending' | 'delivered' | 'failed' | 'retrying';
  retry_count: number;
  last_error: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface CheckoutSession {
  id: string;
  merchant_id: string;
  customer_email: string | null;
  cart_total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'abandoned';
  failure_reason: string | null;
  stripe_payment_intent_id: string | null;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
}

// Support Ticket Types
export type TicketCategory = 'checkout' | 'api' | 'webhook' | 'migration' | 'payment' | 'general' | 'unknown';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketSource = 'email' | 'chat' | 'phone' | 'manual' | 'auto_detected';

export interface SupportTicket {
  id: string;
  merchant_id: string | null;
  external_ticket_id: string | null;
  subject: string;
  body: string;
  category: TicketCategory | null;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  embedding: number[] | null;
  sentiment_score: number | null;
  auto_classified: boolean;
  agent_response: string | null;
  agent_confidence: number | null;
  resolved_by: 'agent' | 'human' | 'auto_resolved' | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

// Incident Types
export type IncidentType =
  | 'migration_misstep'
  | 'platform_regression'
  | 'documentation_gap'
  | 'config_error'
  | 'payment_issue'
  | 'api_outage';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'detected' | 'investigating' | 'confirmed' | 'mitigating' | 'resolved' | 'false_positive';

export interface Evidence {
  type: 'ticket' | 'api_error' | 'webhook_failure' | 'checkout_failure' | 'pattern' | 'metric';
  source_id: string;
  description: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  type: IncidentType;
  severity: IncidentSeverity;
  affected_merchants: string[];
  affected_merchant_count: number;
  root_cause: string | null;
  root_cause_confidence: number | null;
  evidence: Evidence[];
  related_tickets: string[];
  status: IncidentStatus;
  assigned_to: string | null;
  resolution: string | null;
  impact_assessment: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

// Agent Action Types
export type ActionType =
  | 'auto_reply'
  | 'escalate_engineering'
  | 'escalate_support'
  | 'notify_merchant'
  | 'notify_merchants_batch'
  | 'update_documentation'
  | 'apply_mitigation'
  | 'rollback_recommendation'
  | 'config_fix_suggestion'
  | 'create_incident';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';

export interface AgentAction {
  id: string;
  incident_id: string | null;
  ticket_id: string | null;
  action_type: ActionType;
  description: string;
  details: Record<string, unknown> | null;
  confidence: number;
  risk_level: RiskLevel;
  requires_approval: boolean;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  executed: boolean;
  executed_at: string | null;
  execution_result: Record<string, unknown> | null;
  created_at: string;
}

// Reasoning Log Types
export type AgentPhase = 'observe' | 'reason' | 'decide' | 'act';

export interface ReasoningLog {
  id: string;
  incident_id: string | null;
  ticket_id: string | null;
  action_id: string | null;
  step_number: number;
  phase: AgentPhase;
  thought: string;
  evidence: Record<string, unknown> | null;
  conclusion: string | null;
  confidence: number | null;
  tokens_used: number | null;
  model_used: string | null;
  duration_ms: number | null;
  created_at: string;
}

// Agent State Types
export interface AgentState {
  id: string;
  key: string;
  value: Record<string, unknown>;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Pattern Types
export interface AgentPattern {
  id: string;
  pattern_type: string;
  pattern_signature: Record<string, unknown>;
  description: string | null;
  occurrences: number;
  last_seen_at: string;
  associated_root_cause: string | null;
  confidence: number | null;
  active: boolean;
  created_at: string;
}

// ============================================
// AGENT LOOP TYPES
// ============================================

// Signal types that the Observer collects
export interface Signal {
  id: string;
  type: 'ticket' | 'api_error' | 'webhook_failure' | 'checkout_failure' | 'metric_anomaly';
  source: string;
  merchant_id: string | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// Observation result from Observer
export interface Observation {
  signals: Signal[];
  patterns_detected: AgentPattern[];
  anomalies: {
    type: string;
    description: string;
    affected_merchants: string[];
    severity: IncidentSeverity;
  }[];
  summary: string;
  timestamp: string;
}

// Reasoning result from Reasoner
export interface ReasoningResult {
  incident_id: string | null;
  classification: IncidentType;
  root_cause_hypothesis: string;
  confidence: number;
  evidence_chain: Evidence[];
  affected_scope: {
    merchants: string[];
    features: string[];
    estimated_impact: string;
  };
  reasoning_steps: ReasoningLog[];
}

// Decision result from Decider
export interface Decision {
  recommended_actions: {
    action_type: ActionType;
    description: string;
    confidence: number;
    risk_level: RiskLevel;
    requires_approval: boolean;
    priority: number;
    details: Record<string, unknown>;
  }[];
  reasoning: string;
  alternatives_considered: string[];
}

// Execution result from Actor
export interface ExecutionResult {
  action_id: string;
  success: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
  side_effects: string[];
  rollback_available: boolean;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  active_incidents: number;
  pending_actions: number;
  open_tickets: number;
  merchants_affected: number;
  resolution_rate: number;
  avg_response_time: number;
}

export interface IncidentSummary {
  id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affected_merchant_count: number;
  created_at: string;
  time_to_detect: number | null;
}

export interface ActionQueueItem {
  id: string;
  action_type: ActionType;
  description: string;
  confidence: number;
  risk_level: RiskLevel;
  incident_title: string | null;
  merchant_name: string | null;
  created_at: string;
}

// ============================================
// RECOMMENDATION TYPES
// ============================================

export interface ProductRecommendation {
  product_id: string;
  association_type: 'bought_together' | 'viewed_together' | 'similar' | 'complementary';
  score: number;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}
