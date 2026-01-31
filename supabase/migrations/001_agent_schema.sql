-- ============================================
-- COSMIC COMMERCE: AGENT & MERCHANT SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings (ticket similarity)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- MERCHANT TABLES
-- ============================================

-- Merchants (store owners migrating to headless)
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'migrating', 'onboarding')),
  migration_status TEXT DEFAULT 'not_started' CHECK (migration_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  migration_stage INTEGER DEFAULT 0, -- 0-100 percentage
  migration_started_at TIMESTAMPTZ,
  migration_completed_at TIMESTAMPTZ,
  api_key_configured BOOLEAN DEFAULT false,
  webhook_configured BOOLEAN DEFAULT false,
  stripe_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merchant API logs (for observing errors)
CREATE TABLE merchant_api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  request_body JSONB,
  response_body JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'retrying')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkout sessions (for tracking failures)
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  customer_email TEXT,
  cart_total DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'abandoned')),
  failure_reason TEXT,
  stripe_payment_intent_id TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- AGENT TABLES
-- ============================================

-- Support tickets ingested by the agent
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  external_ticket_id TEXT, -- ID from external ticketing system
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT CHECK (category IN ('checkout', 'api', 'webhook', 'migration', 'payment', 'general', 'unknown')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('email', 'chat', 'phone', 'manual', 'auto_detected')),
  embedding VECTOR(1536), -- For semantic similarity search
  sentiment_score FLOAT, -- -1 to 1 (negative to positive)
  auto_classified BOOLEAN DEFAULT false,
  agent_response TEXT,
  agent_confidence FLOAT,
  resolved_by TEXT CHECK (resolved_by IN ('agent', 'human', 'auto_resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Incidents detected by the agent (clusters of related issues)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('migration_misstep', 'platform_regression', 'documentation_gap', 'config_error', 'payment_issue', 'api_outage')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_merchants UUID[] DEFAULT '{}',
  affected_merchant_count INTEGER DEFAULT 0,
  root_cause TEXT,
  root_cause_confidence FLOAT,
  evidence JSONB DEFAULT '[]', -- Array of evidence items
  related_tickets UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'confirmed', 'mitigating', 'resolved', 'false_positive')),
  assigned_to TEXT, -- Team or person
  resolution TEXT,
  impact_assessment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Agent actions (proposed and executed)
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'auto_reply',
    'escalate_engineering',
    'escalate_support',
    'notify_merchant',
    'notify_merchants_batch',
    'update_documentation',
    'apply_mitigation',
    'rollback_recommendation',
    'config_fix_suggestion',
    'create_incident'
  )),
  description TEXT NOT NULL,
  details JSONB, -- Action-specific details
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  executed BOOLEAN DEFAULT false,
  executed_at TIMESTAMPTZ,
  execution_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent reasoning logs (step-by-step thinking for explainability)
CREATE TABLE reasoning_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  action_id UUID REFERENCES agent_actions(id) ON DELETE SET NULL,
  step_number INTEGER NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('observe', 'reason', 'decide', 'act')),
  thought TEXT NOT NULL, -- What the agent is thinking
  evidence JSONB, -- Supporting data
  conclusion TEXT, -- What was decided
  confidence FLOAT,
  tokens_used INTEGER,
  model_used TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent state (persistent memory)
CREATE TABLE agent_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern memory (learned patterns for faster detection)
CREATE TABLE agent_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL, -- e.g., 'error_signature', 'ticket_cluster', 'behavior_anomaly'
  pattern_signature JSONB NOT NULL,
  description TEXT,
  occurrences INTEGER DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  associated_root_cause TEXT,
  confidence FLOAT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT RECOMMENDATIONS (Amazon-style)
-- ============================================

-- Product view history (for recommendations)
CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID,
  product_id UUID NOT NULL,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frequently bought together
CREATE TABLE product_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL,
  associated_product_id UUID NOT NULL,
  association_type TEXT CHECK (association_type IN ('bought_together', 'viewed_together', 'similar', 'complementary')),
  score FLOAT DEFAULT 0, -- Association strength
  occurrence_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, associated_product_id, association_type)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Merchant indexes
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_migration_status ON merchants(migration_status);
CREATE INDEX idx_merchant_api_logs_merchant ON merchant_api_logs(merchant_id, created_at DESC);
CREATE INDEX idx_merchant_api_logs_errors ON merchant_api_logs(merchant_id) WHERE status_code >= 400;
CREATE INDEX idx_webhook_logs_merchant ON webhook_logs(merchant_id, created_at DESC);
CREATE INDEX idx_webhook_logs_failed ON webhook_logs(merchant_id) WHERE delivery_status = 'failed';
CREATE INDEX idx_checkout_sessions_merchant ON checkout_sessions(merchant_id, created_at DESC);
CREATE INDEX idx_checkout_sessions_failed ON checkout_sessions(merchant_id) WHERE status = 'failed';

-- Ticket indexes
CREATE INDEX idx_tickets_merchant ON support_tickets(merchant_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_category ON support_tickets(category);
CREATE INDEX idx_tickets_created ON support_tickets(created_at DESC);

-- Incident indexes
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);

-- Action indexes
CREATE INDEX idx_actions_incident ON agent_actions(incident_id);
CREATE INDEX idx_actions_requires_approval ON agent_actions(requires_approval) WHERE approval_status = 'pending';
CREATE INDEX idx_actions_pending ON agent_actions(created_at DESC) WHERE approval_status = 'pending';

-- Reasoning indexes
CREATE INDEX idx_reasoning_incident ON reasoning_logs(incident_id);
CREATE INDEX idx_reasoning_action ON reasoning_logs(action_id);

-- Recommendation indexes
CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_session ON product_views(session_id);
CREATE INDEX idx_product_associations_product ON product_associations(product_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agent_state_updated_at
  BEFORE UPDATE ON agent_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update affected merchant count on incidents
CREATE OR REPLACE FUNCTION update_affected_merchant_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.affected_merchant_count = array_length(NEW.affected_merchants, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incident_merchant_count
  BEFORE INSERT OR UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_affected_merchant_count();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Merchants can only see their own data
CREATE POLICY merchants_own_data ON merchants
  FOR ALL USING (auth.uid() = user_id);

-- Support tickets visible to merchant owner and admins
CREATE POLICY tickets_merchant_access ON support_tickets
  FOR SELECT USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Incidents visible to admins only
CREATE POLICY incidents_admin_only ON incidents
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Actions visible to admins only
CREATE POLICY actions_admin_only ON agent_actions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
