// ============================================
// AUTH SERVICE - Simplified Authentication
// ============================================

import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import type {
  User,
  Session,
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  UserRole,
} from './types';

// ============================================
// SIMPLE PASSWORD HASHING (PBKDF2 via Node.js crypto)
// ============================================

function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPasswordSync(password: string, storedHash: string): boolean {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, 'hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    return hash.toString('hex') === hashHex;
  } catch {
    return false;
  }
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
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
      const passwordHash = hashPasswordSync(data.password);

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
          status: 'active', // Simplified: no email verification required
          email_verified: true,
        })
        .select()
        .single();

      if (userError || !user) {
        console.error('User creation error:', userError);
        return { success: false, error: 'Failed to create user' };
      }

      // Create role-specific profile
      await this.createRoleProfile(user.id, role, data);

      // Create session immediately
      const session = await this.createSession(user.id);

      return {
        success: true,
        user: user as User,
        session: session,
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
        console.log('User not found:', data.email);
        return { success: false, error: 'Invalid email or password' };
      }

      // Check account status
      if (user.status === 'suspended') {
        return { success: false, error: 'Account has been suspended.' };
      }

      if (user.status === 'deactivated') {
        return { success: false, error: 'Account has been deactivated.' };
      }

      // Verify password
      const isValidPassword = verifyPasswordSync(data.password, user.password_hash);

      if (!isValidPassword) {
        console.log('Invalid password for user:', data.email);
        return { success: false, error: 'Invalid email or password' };
      }

      // Create session
      const session = await this.createSession(user.id, data.remember_me, ipAddress, userAgent);

      // Update user login info
      await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          last_login_ip: ipAddress,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq('id', user.id);

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
    const tokenHash = hashToken(token);

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
      const tokenHash = hashToken(token);

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
      if (user.status === 'suspended' || user.status === 'deactivated') {
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
    const tokenHash = hashToken(token);

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

    // Simple role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // All permissions
      support: ['view_users', 'view_orders', 'manage_tickets'],
      merchant: ['manage_products', 'view_orders', 'manage_store'],
      customer: ['view_products', 'place_orders', 'manage_profile'],
    };

    return rolePermissions[user.role] || [];
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes('*') || permissions.includes(permissionName);
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
    const isValid = verifyPasswordSync(currentPassword, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password
    const validation = this.validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Hash and update
    const newPasswordHash = hashPasswordSync(newPassword);

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
  }
}

// Export singleton instance
export const authService = new AuthService();
