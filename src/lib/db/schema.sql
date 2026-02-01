-- ============================================
-- COSMIC COMMERCE: SQLite Schema
-- Converted from PostgreSQL/Supabase
-- ============================================

-- ============================================
-- E-COMMERCE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  compare_at_price REAL,
  category_id TEXT REFERENCES categories(id),
  merchant_id TEXT REFERENCES merchants(id) ON DELETE SET NULL,
  brand TEXT,
  stock_quantity INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  images TEXT DEFAULT '[]', -- JSON array
  is_featured INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  discount_percentage REAL DEFAULT 0,
  specifications TEXT DEFAULT '{}', -- JSON object
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  address TEXT DEFAULT '{}', -- JSON object
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount REAL NOT NULL,
  shipping_address TEXT NOT NULL, -- JSON object
  payment_intent_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wishlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- MERCHANT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'migrating', 'onboarding')),
  migration_status TEXT DEFAULT 'not_started' CHECK (migration_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  migration_stage INTEGER DEFAULT 0,
  migration_started_at TEXT,
  migration_completed_at TEXT,
  api_key_configured INTEGER DEFAULT 0,
  webhook_configured INTEGER DEFAULT 0,
  stripe_connected INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS merchant_api_logs (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  request_body TEXT, -- JSON
  response_body TEXT, -- JSON
  duration_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload TEXT, -- JSON
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'retrying')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  delivered_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  customer_email TEXT,
  cart_total REAL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'abandoned')),
  failure_reason TEXT,
  stripe_payment_intent_id TEXT,
  error_code TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- ============================================
-- AGENT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE SET NULL,
  external_ticket_id TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT CHECK (category IN ('checkout', 'api', 'webhook', 'migration', 'payment', 'general', 'unknown')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('email', 'chat', 'phone', 'manual', 'auto_detected')),
  sentiment_score REAL,
  auto_classified INTEGER DEFAULT 0,
  agent_response TEXT,
  agent_confidence REAL,
  resolved_by TEXT CHECK (resolved_by IN ('agent', 'human', 'auto_resolved') OR resolved_by IS NULL),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('migration_misstep', 'platform_regression', 'documentation_gap', 'config_error', 'payment_issue', 'api_outage')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_merchants TEXT DEFAULT '[]', -- JSON array of UUIDs
  affected_merchant_count INTEGER DEFAULT 0,
  root_cause TEXT,
  root_cause_confidence REAL,
  evidence TEXT DEFAULT '[]', -- JSON array
  related_tickets TEXT DEFAULT '[]', -- JSON array of UUIDs
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'confirmed', 'mitigating', 'resolved', 'false_positive')),
  assigned_to TEXT,
  resolution TEXT,
  impact_assessment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS agent_actions (
  id TEXT PRIMARY KEY,
  incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
  ticket_id TEXT REFERENCES support_tickets(id) ON DELETE SET NULL,
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
  details TEXT, -- JSON
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  requires_approval INTEGER DEFAULT 0,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approved_by TEXT,
  approved_at TEXT,
  rejection_reason TEXT,
  executed INTEGER DEFAULT 0,
  executed_at TEXT,
  execution_result TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reasoning_logs (
  id TEXT PRIMARY KEY,
  incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
  ticket_id TEXT REFERENCES support_tickets(id) ON DELETE SET NULL,
  action_id TEXT REFERENCES agent_actions(id) ON DELETE SET NULL,
  step_number INTEGER NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('observe', 'reason', 'decide', 'act')),
  thought TEXT NOT NULL,
  evidence TEXT, -- JSON
  conclusion TEXT,
  confidence REAL,
  tokens_used INTEGER,
  model_used TEXT,
  duration_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_state (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL, -- JSON
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  pattern_signature TEXT NOT NULL, -- JSON
  description TEXT,
  occurrences INTEGER DEFAULT 1,
  last_seen_at TEXT DEFAULT (datetime('now')),
  associated_root_cause TEXT,
  confidence REAL,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- PRODUCT RECOMMENDATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS product_views (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  product_id TEXT NOT NULL,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
  viewed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_associations (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  associated_product_id TEXT NOT NULL,
  association_type TEXT CHECK (association_type IN ('bought_together', 'viewed_together', 'similar', 'complementary')),
  score REAL DEFAULT 0,
  occurrence_count INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(product_id, associated_product_id, association_type)
);

-- ============================================
-- AUTH TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'support', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active', 'suspended', 'pending_verification', 'deactivated')),
  email_verified INTEGER DEFAULT 0,
  email_verified_at TEXT,
  phone_verified INTEGER DEFAULT 0,
  last_login_at TEXT,
  last_login_ip TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  password_changed_at TEXT,
  must_change_password INTEGER DEFAULT 0,
  two_factor_enabled INTEGER DEFAULT 0,
  two_factor_secret TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT UNIQUE,
  device_info TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  is_valid INTEGER DEFAULT 1,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_activity_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('customer', 'merchant', 'support', 'admin')),
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(role, permission_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted INTEGER DEFAULT 1,
  granted_by TEXT REFERENCES users(id),
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS merchant_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_id TEXT REFERENCES merchants(id) ON DELETE SET NULL,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT, -- JSON
  tax_id TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents TEXT, -- JSON
  verified_at TEXT,
  verified_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  department TEXT DEFAULT 'general',
  specializations TEXT DEFAULT '[]', -- JSON array
  max_concurrent_tickets INTEGER DEFAULT 10,
  current_ticket_count INTEGER DEFAULT 0,
  avg_resolution_time INTEGER,
  satisfaction_rating REAL,
  is_available INTEGER DEFAULT 1,
  shift_start TEXT,
  shift_end TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_level INTEGER DEFAULT 1,
  can_manage_admins INTEGER DEFAULT 0,
  can_manage_permissions INTEGER DEFAULT 0,
  can_access_billing INTEGER DEFAULT 0,
  can_access_logs INTEGER DEFAULT 1,
  ip_whitelist TEXT DEFAULT '[]', -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_shipping_address TEXT, -- JSON
  default_billing_address TEXT, -- JSON
  saved_payment_methods TEXT, -- JSON
  stripe_customer_id TEXT,
  loyalty_points INTEGER DEFAULT 0,
  lifetime_spend REAL DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  preferences TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset', 'phone_verification', 'two_factor_setup')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  success INTEGER DEFAULT 1,
  failure_reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TEXT,
  token_type TEXT,
  scope TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(provider, provider_account_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Merchants
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_migration ON merchants(migration_status);
CREATE INDEX IF NOT EXISTS idx_merchant_api_logs_merchant ON merchant_api_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_merchant ON webhook_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_merchant ON checkout_sessions(merchant_id);

-- Tickets & Incidents
CREATE INDEX IF NOT EXISTS idx_tickets_merchant ON support_tickets(merchant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

-- Actions & Reasoning
CREATE INDEX IF NOT EXISTS idx_actions_incident ON agent_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_actions_approval ON agent_actions(approval_status);
CREATE INDEX IF NOT EXISTS idx_reasoning_incident ON reasoning_logs(incident_id);

-- Users & Auth
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON auth_audit_log(user_id);

-- Recommendations
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_product_associations_product ON product_associations(product_id);
