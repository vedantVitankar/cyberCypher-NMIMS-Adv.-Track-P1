// ============================================
// AUTH SERVICE - Core Authentication Logic
// ============================================

import { supabase } from '@/lib/supabase';
import type {
  User,
  Session,
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  UserRole,
  TokenPayload,
} from './types';

// Crypto utilities using Web Crypto API
const encoder = new TextEncoder();

async function hashPassword(password: string): Promise<string> {
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  // Hash password with salt using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const computedHashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computedHashHex === hashHex;
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================
// AUTH SERVICE CLASS
// ============================================

class AuthService {
  // ============================================
  // SIGN UP
  // ============================================

  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    try {
      // Validate email format
      if (!this.isValidEmail(data.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Validate password strength
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Determine role (default to customer, admin/support require manual assignment)
      const role: UserRole = data.role === 'merchant' ? 'merchant' : 'customer';

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: data.email.toLowerCase(),
          password_hash: passwordHash,
          full_name: data.full_name,
          phone: data.phone,
          role: role,
          status: 'pending_verification',
          email_verified: false,
        })
        .select()
        .single();

      if (userError || !user) {
        console.error('User creation error:', userError);
        return { success: false, error: 'Failed to create user' };
      }

      // Create role-specific profile
      await this.createRoleProfile(user.id, role, data);

      // Generate verification token
      await this.createVerificationToken(user.id, 'email_verification');

      // Log the event
      await this.logAuthEvent(user.id, 'signup', true);

      return {
        success: true,
        user: user as User,
        requires_verification: true,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // ============================================
  // SIGN IN
  // ============================================

  async signIn(data: SignInRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Get user by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email.toLowerCase())
        .single();

      if (userError || !user) {
        await this.logAuthEvent(null, 'login_failed', false, 'User not found');
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { success: false, error: 'Account is temporarily locked. Please try again later.' };
      }

      // Check account status
      if (user.status === 'suspended') {
        return { success: false, error: 'Account has been suspended. Please contact support.' };
      }

      if (user.status === 'deactivated') {
        return { success: false, error: 'Account has been deactivated.' };
      }

      // Verify password
      const isValidPassword = await verifyPassword(data.password, user.password_hash);

      if (!isValidPassword) {
        // Increment failed attempts
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        const updates: Record<string, unknown> = { failed_login_attempts: failedAttempts };

        // Lock account after 5 failed attempts (30 minutes)
        if (failedAttempts >= 5) {
          updates.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        }

        await supabase.from('users').update(updates).eq('id', user.id);
        await this.logAuthEvent(user.id, 'login_failed', false, 'Invalid password');

        return { success: false, error: 'Invalid email or password' };
      }

      // Check email verification for non-admin roles
      if (!user.email_verified && user.role !== 'admin') {
        return {
          success: false,
          error: 'Please verify your email before signing in',
          requires_verification: true,
        };
      }

      // Check 2FA if enabled
      if (user.two_factor_enabled) {
        // Return requiring 2FA (would need additional step)
        return {
          success: false,
          requires_2fa: true,
          user: user as User,
        };
      }

      // Create session
      const session = await this.createSession(user.id, data.remember_me, ipAddress, userAgent);

      // Update user login info and reset failed attempts
      await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          last_login_ip: ipAddress,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq('id', user.id);

      // Log successful login
      await this.logAuthEvent(user.id, 'login', true, null, ipAddress, userAgent);

      return {
        success: true,
        user: user as User,
        session: session,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async createSession(
    userId: string,
    rememberMe?: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Session> {
    const token = generateToken();
    const tokenHash = await hashToken(token);

    // Session duration: 7 days if remember me, otherwise 24 hours
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    );

    const { data: session, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        device_info: userAgent ? this.parseUserAgent(userAgent) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...session,
      token: token, // Return unhashed token to client
    } as Session;
  }

  async validateSession(token: string): Promise<{ user: User; session: Session } | null> {
    try {
      const tokenHash = await hashToken(token);

      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('is_valid', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !session) return null;

      // Get user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .single();

      if (userError || !user) return null;

      // Check user status
      if (user.status !== 'active' && user.status !== 'pending_verification') {
        return null;
      }

      // Update last activity
      await supabase
        .from('user_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', session.id);

      return {
        user: user as User,
        session: { ...session, token } as Session,
      };
    } catch {
      return null;
    }
  }

  async invalidateSession(token: string): Promise<void> {
    const tokenHash = await hashToken(token);

    await supabase
      .from('user_sessions')
      .update({ is_valid: false })
      .eq('token_hash', tokenHash);
  }

  async invalidateAllSessions(userId: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ is_valid: false })
      .eq('user_id', userId);
  }

  // ============================================
  // PERMISSIONS
  // ============================================

  async getUserPermissions(userId: string): Promise<string[]> {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user) return [];

    // Get role-based permissions
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select('permissions(name)')
      .eq('role', user.role);

    // Get user-specific permissions
    const { data: userPermissions } = await supabase
      .from('user_permissions')
      .select('permissions(name), granted')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    const permissions = new Set<string>();

    // Add role permissions
    rolePermissions?.forEach((rp: { permissions: { name: string } }) => {
      if (rp.permissions?.name) {
        permissions.add(rp.permissions.name);
      }
    });

    // Apply user-specific overrides
    userPermissions?.forEach((up: { permissions: { name: string }; granted: boolean }) => {
      if (up.permissions?.name) {
        if (up.granted) {
          permissions.add(up.permissions.name);
        } else {
          permissions.delete(up.permissions.name);
        }
      }
    });

    return Array.from(permissions);
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionName);
  }

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password
    const validation = this.validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Hash and update
    const newPasswordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString(),
        must_change_password: false,
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: 'Failed to update password' };
    }

    // Invalidate all sessions except current
    await this.logAuthEvent(userId, 'password_change', true);

    return { success: true };
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    await this.createVerificationToken(user.id, 'password_reset');
    // In production, send email with reset link

    return { success: true };
  }

  // ============================================
  // VERIFICATION
  // ============================================

  async verifyEmail(token: string): Promise<AuthResponse> {
    const tokenHash = await hashToken(token);

    const { data: verificationToken } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('type', 'email_verification')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!verificationToken) {
      return { success: false, error: 'Invalid or expired verification link' };
    }

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', verificationToken.user_id)
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Failed to verify email' };
    }

    // Mark token as used
    await supabase
      .from('verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verificationToken.id);

    await this.logAuthEvent(verificationToken.user_id, 'email_verified', true);

    return { success: true, user: user as User };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async createRoleProfile(userId: string, role: UserRole, data: SignUpRequest): Promise<void> {
    switch (role) {
      case 'customer':
        await supabase.from('customer_profiles').insert({ user_id: userId });
        break;
      case 'merchant':
        await supabase.from('merchant_profiles').insert({
          user_id: userId,
          business_name: data.business_name,
        });
        break;
      case 'support':
        await supabase.from('support_profiles').insert({
          user_id: userId,
          employee_id: data.employee_id,
        });
        break;
      case 'admin':
        await supabase.from('admin_profiles').insert({ user_id: userId });
        break;
    }
  }

  private async createVerificationToken(userId: string, type: string): Promise<string> {
    const token = generateToken();
    const tokenHash = await hashToken(token);

    await supabase.from('verification_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      type: type,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });

    return token;
  }

  private async logAuthEvent(
    userId: string | null,
    action: string,
    success: boolean,
    failureReason?: string | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await supabase.from('auth_audit_log').insert({
      user_id: userId,
      action: action,
      success: success,
      failure_reason: failureReason,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one special character' };
    }
    return { valid: true };
  }

  private parseUserAgent(userAgent: string): { browser?: string; os?: string; device?: string } {
    // Simple parsing - in production use a proper library
    const result: { browser?: string; os?: string; device?: string } = {};

    if (userAgent.includes('Chrome')) result.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
    else if (userAgent.includes('Safari')) result.browser = 'Safari';
    else if (userAgent.includes('Edge')) result.browser = 'Edge';

    if (userAgent.includes('Windows')) result.os = 'Windows';
    else if (userAgent.includes('Mac')) result.os = 'macOS';
    else if (userAgent.includes('Linux')) result.os = 'Linux';
    else if (userAgent.includes('Android')) result.os = 'Android';
    else if (userAgent.includes('iOS')) result.os = 'iOS';

    if (userAgent.includes('Mobile')) result.device = 'Mobile';
    else if (userAgent.includes('Tablet')) result.device = 'Tablet';
    else result.device = 'Desktop';

    return result;
  }
}

// Export singleton instance
export const authService = new AuthService();
