-- ============================================
-- INDUSTRIAL AUTH SCHEMA
-- Role-Based Access Control (RBAC)
-- ============================================

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('customer', 'merchant', 'support', 'admin');

-- User Status Enum
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending_verification', 'deactivated');

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- For custom auth, null if using OAuth
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  status user_status NOT NULL DEFAULT 'pending_verification',
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  phone_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  must_change_password BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SESSIONS TABLE
-- ============================================

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, -- Hashed session token
  refresh_token_hash TEXT UNIQUE,
  device_info JSONB, -- Browser, OS, device type
  ip_address TEXT,
  user_agent TEXT,
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PERMISSIONS & ROLES
-- ============================================

-- Granular permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL, -- e.g., 'orders', 'products', 'users', 'tickets'
  action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'manage'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-permission mapping
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- User-specific permission overrides (for edge cases)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true, -- true = grant, false = revoke
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- ============================================
-- MERCHANT PROFILES (Extended for auth)
-- ============================================

CREATE TABLE merchant_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address JSONB,
  tax_id TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents JSONB,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPPORT AGENT PROFILES
-- ============================================

CREATE TABLE support_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  department TEXT DEFAULT 'general',
  specializations TEXT[], -- e.g., ['payments', 'migration', 'api']
  max_concurrent_tickets INTEGER DEFAULT 10,
  current_ticket_count INTEGER DEFAULT 0,
  avg_resolution_time INTEGER, -- in minutes
  satisfaction_rating FLOAT,
  is_available BOOLEAN DEFAULT true,
  shift_start TIME,
  shift_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADMIN PROFILES
-- ============================================

CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_level INTEGER DEFAULT 1, -- 1 = basic, 2 = senior, 3 = super admin
  can_manage_admins BOOLEAN DEFAULT false,
  can_manage_permissions BOOLEAN DEFAULT false,
  can_access_billing BOOLEAN DEFAULT false,
  can_access_logs BOOLEAN DEFAULT true,
  ip_whitelist TEXT[], -- Restrict admin access to specific IPs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMER PROFILES
-- ============================================

CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_shipping_address JSONB,
  default_billing_address JSONB,
  saved_payment_methods JSONB, -- Stripe customer ID, etc.
  stripe_customer_id TEXT,
  loyalty_points INTEGER DEFAULT 0,
  lifetime_spend DECIMAL(12,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  preferences JSONB, -- Notification settings, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PASSWORD RESET & VERIFICATION TOKENS
-- ============================================

CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset', 'phone_verification', 'two_factor_setup')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'password_change', 'role_change', etc.
  resource TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OAUTH ACCOUNTS (for social login)
-- ============================================

CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'github', 'facebook'
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_auth_id ON users(auth_id);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_valid ON user_sessions(is_valid, expires_at);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

CREATE INDEX idx_verification_tokens_user ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_hash ON verification_tokens(token_hash);

CREATE INDEX idx_audit_user ON auth_audit_log(user_id);
CREATE INDEX idx_audit_action ON auth_audit_log(action);
CREATE INDEX idx_audit_created ON auth_audit_log(created_at DESC);

CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON oauth_accounts(provider, provider_account_id);

-- ============================================
-- DEFAULT PERMISSIONS
-- ============================================

INSERT INTO permissions (name, description, resource, action) VALUES
-- Product permissions
('products:read', 'View products', 'products', 'read'),
('products:create', 'Create products', 'products', 'create'),
('products:update', 'Update products', 'products', 'update'),
('products:delete', 'Delete products', 'products', 'delete'),
('products:manage', 'Full product management', 'products', 'manage'),

-- Order permissions
('orders:read', 'View orders', 'orders', 'read'),
('orders:create', 'Create orders', 'orders', 'create'),
('orders:update', 'Update orders', 'orders', 'update'),
('orders:cancel', 'Cancel orders', 'orders', 'cancel'),
('orders:refund', 'Process refunds', 'orders', 'refund'),
('orders:manage', 'Full order management', 'orders', 'manage'),

-- User permissions
('users:read', 'View users', 'users', 'read'),
('users:create', 'Create users', 'users', 'create'),
('users:update', 'Update users', 'users', 'update'),
('users:delete', 'Delete users', 'users', 'delete'),
('users:manage', 'Full user management', 'users', 'manage'),

-- Ticket permissions
('tickets:read', 'View support tickets', 'tickets', 'read'),
('tickets:create', 'Create support tickets', 'tickets', 'create'),
('tickets:respond', 'Respond to tickets', 'tickets', 'respond'),
('tickets:close', 'Close tickets', 'tickets', 'close'),
('tickets:manage', 'Full ticket management', 'tickets', 'manage'),

-- Merchant permissions
('merchants:read', 'View merchants', 'merchants', 'read'),
('merchants:verify', 'Verify merchants', 'merchants', 'verify'),
('merchants:suspend', 'Suspend merchants', 'merchants', 'suspend'),
('merchants:manage', 'Full merchant management', 'merchants', 'manage'),

-- Agent permissions
('agent:view', 'View agent dashboard', 'agent', 'view'),
('agent:run', 'Run agent manually', 'agent', 'run'),
('agent:approve', 'Approve agent actions', 'agent', 'approve'),
('agent:configure', 'Configure agent settings', 'agent', 'configure'),

-- Admin permissions
('admin:access', 'Access admin panel', 'admin', 'access'),
('admin:settings', 'Manage system settings', 'admin', 'settings'),
('admin:logs', 'View audit logs', 'admin', 'logs'),
('admin:billing', 'Access billing', 'admin', 'billing');

-- ============================================
-- DEFAULT ROLE-PERMISSION MAPPINGS
-- ============================================

-- Customer permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'customer', id FROM permissions WHERE name IN (
  'products:read',
  'orders:read',
  'orders:create',
  'orders:cancel',
  'tickets:create',
  'tickets:read'
);

-- Merchant permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'merchant', id FROM permissions WHERE name IN (
  'products:read',
  'products:create',
  'products:update',
  'products:delete',
  'orders:read',
  'orders:update',
  'orders:refund',
  'tickets:create',
  'tickets:read'
);

-- Support permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'support', id FROM permissions WHERE name IN (
  'products:read',
  'orders:read',
  'orders:update',
  'orders:cancel',
  'orders:refund',
  'users:read',
  'tickets:read',
  'tickets:respond',
  'tickets:close',
  'tickets:manage',
  'merchants:read',
  'agent:view',
  'agent:approve'
);

-- Admin permissions (all permissions)
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_merchant_profiles_updated_at
  BEFORE UPDATE ON merchant_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_support_profiles_updated_at
  BEFORE UPDATE ON support_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
  v_has_permission BOOLEAN;
  v_user_override BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM users WHERE id = p_user_id;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check user-specific override first
  SELECT granted INTO v_user_override
  FROM user_permissions up
  JOIN permissions p ON up.permission_id = p.id
  WHERE up.user_id = p_user_id
    AND p.name = p_permission_name
    AND (up.expires_at IS NULL OR up.expires_at > NOW());

  IF v_user_override IS NOT NULL THEN
    RETURN v_user_override;
  END IF;

  -- Check role-based permission
  SELECT EXISTS(
    SELECT 1 FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role = v_role AND p.name = p_permission_name
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log auth events
CREATE OR REPLACE FUNCTION log_auth_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_failure_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO auth_audit_log (
    user_id, action, resource, resource_id, old_values, new_values,
    ip_address, user_agent, success, failure_reason
  ) VALUES (
    p_user_id, p_action, p_resource, p_resource_id, p_old_values, p_new_values,
    p_ip_address, p_user_agent, p_success, p_failure_reason
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data (unless admin/support)
CREATE POLICY users_self_access ON users
  FOR SELECT USING (
    id = auth.uid()::uuid
    OR user_has_permission(auth.uid()::uuid, 'users:read')
  );

-- Sessions - users can only see their own
CREATE POLICY sessions_self_access ON user_sessions
  FOR ALL USING (user_id = auth.uid()::uuid);

-- Profiles - self access or with permission
CREATE POLICY customer_profiles_access ON customer_profiles
  FOR ALL USING (
    user_id = auth.uid()::uuid
    OR user_has_permission(auth.uid()::uuid, 'users:read')
  );

CREATE POLICY merchant_profiles_access ON merchant_profiles
  FOR ALL USING (
    user_id = auth.uid()::uuid
    OR user_has_permission(auth.uid()::uuid, 'merchants:read')
  );
