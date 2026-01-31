// ============================================
// AUTH TYPE DEFINITIONS
// ============================================

export type UserRole = 'customer' | 'merchant' | 'support' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'deactivated';

export interface User {
  id: string;
  auth_id: string | null;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  email_verified_at: string | null;
  phone_verified: boolean;
  last_login_at: string | null;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  device_info: {
    browser?: string;
    os?: string;
    device?: string;
  } | null;
  ip_address: string | null;
  created_at: string;
  last_activity_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

// Profile types for each role
export interface CustomerProfile {
  id: string;
  user_id: string;
  default_shipping_address: Address | null;
  default_billing_address: Address | null;
  stripe_customer_id: string | null;
  loyalty_points: number;
  lifetime_spend: number;
  order_count: number;
  preferences: CustomerPreferences | null;
}

export interface MerchantProfile {
  id: string;
  user_id: string;
  merchant_id: string | null;
  business_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: Address | null;
  tax_id: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at: string | null;
}

export interface SupportProfile {
  id: string;
  user_id: string;
  employee_id: string | null;
  department: string;
  specializations: string[];
  max_concurrent_tickets: number;
  current_ticket_count: number;
  avg_resolution_time: number | null;
  satisfaction_rating: number | null;
  is_available: boolean;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  admin_level: number;
  can_manage_admins: boolean;
  can_manage_permissions: boolean;
  can_access_billing: boolean;
  can_access_logs: boolean;
  ip_whitelist: string[] | null;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CustomerPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketing: boolean;
  language: string;
  currency: string;
}

// Auth request/response types
export interface SignUpRequest {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
  phone?: string;
  // Role-specific data
  business_name?: string; // For merchants
  employee_id?: string; // For support/admin
}

export interface SignInRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
  requires_verification?: boolean;
  requires_2fa?: boolean;
}

export interface TokenPayload {
  user_id: string;
  email: string;
  role: UserRole;
  permissions: string[];
  exp: number;
  iat: number;
  jti: string;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpRequest) => Promise<AuthResponse>;
  signIn: (data: SignInRequest) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

// Route protection
export interface ProtectedRouteConfig {
  requireAuth: boolean;
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

// Dashboard routes by role
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  customer: '/',
  merchant: '/merchant',
  support: '/support',
  admin: '/admin',
};

// Public routes (no auth required)
export const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/products/[slug]',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

// Role-specific routes
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  customer: ['/cart', '/checkout', '/orders', '/profile', '/wishlist'],
  merchant: ['/merchant', '/merchant/products', '/merchant/orders', '/merchant/analytics', '/merchant/settings'],
  support: ['/support', '/support/tickets', '/support/merchants', '/admin'],
  admin: ['/admin', '/admin/users', '/admin/merchants', '/admin/settings', '/admin/logs'],
};
