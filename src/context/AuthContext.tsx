'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  User,
  Session,
  AuthContextType,
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  UserRole,
} from '@/lib/auth/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'cosmic_session_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from stored session
  const initializeAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.session) {
          setUser(data.user);
          setSession(data.session);
          setPermissions(data.permissions || []);
        } else {
          localStorage.removeItem(SESSION_TOKEN_KEY);
        }
      } else {
        localStorage.removeItem(SESSION_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sign up
  const signUp = async (data: SignUpRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.session?.token) {
        localStorage.setItem(SESSION_TOKEN_KEY, result.session.token);
        setUser(result.user);
        setSession(result.session);
        setPermissions(result.permissions || []);
      }

      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Sign in
  const signIn = async (data: SignInRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.session?.token) {
        localStorage.setItem(SESSION_TOKEN_KEY, result.session.token);
        setUser(result.user);
        setSession(result.session);
        setPermissions(result.permissions || []);
      }

      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (token) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      setSession(null);
      setPermissions([]);
    }
  };

  // Refresh session
  const refreshSession = async (): Promise<void> => {
    await initializeAuth();
  };

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  // Check if user has a specific role
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    session,
    permissions,
    isLoading,
    isAuthenticated: !!user && !!session,
    signUp,
    signIn,
    signOut,
    refreshSession,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for protected routes
export function useRequireAuth(
  requiredRoles?: UserRole[],
  requiredPermissions?: string[],
  redirectTo?: string
): { isAuthorized: boolean; isLoading: boolean } {
  const { user, permissions, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return { isAuthorized: false, isLoading: true };
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined' && redirectTo) {
      window.location.href = redirectTo;
    }
    return { isAuthorized: false, isLoading: false };
  }

  // Check roles
  if (requiredRoles && requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return { isAuthorized: false, isLoading: false };
    }
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(p => permissions.includes(p));
    if (!hasAllPermissions) {
      return { isAuthorized: false, isLoading: false };
    }
  }

  return { isAuthorized: true, isLoading: false };
}
