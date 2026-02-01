'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Orbit, Mail, Lock, Loader2, ArrowRight, User, Store, Headphones, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ROLE_DASHBOARDS, type UserRole } from '@/lib/auth/types';

const roleConfig = {
  customer: { icon: User, label: 'Customer', color: 'text-blue-400' },
  merchant: { icon: Store, label: 'Merchant', color: 'text-green-400' },
  support: { icon: Headphones, label: 'Support', color: 'text-yellow-400' },
  admin: { icon: Shield, label: 'Admin', color: 'text-red-400' },
};

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn({
        email,
        password,
        remember_me: rememberMe,
      });

      if (!result.success) {
        if (result.requires_verification) {
          toast.error('Please verify your email before signing in');
          router.push('/auth/verify-email?email=' + encodeURIComponent(email));
          return;
        }
        if (result.requires_2fa) {
          toast.info('2FA verification required');
          // Handle 2FA flow
          return;
        }
        throw new Error(result.error || 'Failed to sign in');
      }

      toast.success('Welcome back!');

      // Redirect based on user role
      const userRole = result.user?.role || 'customer';
      const destination = searchParams.get('redirect') || ROLE_DASHBOARDS[userRole];
      router.push(destination);
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 p-8 rounded-3xl bg-deep-charcoal border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-cosmic-orange mb-6">
            <Orbit className="h-10 w-10" />
            <span className="text-3xl font-bold tracking-tighter text-white">
              COSMIC<span className="text-cosmic-orange">STORE</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-white/50 text-sm">Log in to access your cosmic account</p>
        </div>

        {/* Role Selection Tabs */}
        <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)} className="w-full">
          <TabsList className="grid grid-cols-4 bg-cosmic-black/50 p-1">
            {(Object.keys(roleConfig) as UserRole[]).map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={role}
                  value={role}
                  className={`flex flex-col items-center gap-1 py-2 data-[state=active]:bg-deep-charcoal data-[state=active]:${config.color}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/60">Email Address</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="name@cosmos.com"
                required
                className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-white/60">Password</Label>
              <Link href="/auth/forgot-password" className="text-xs text-cosmic-orange hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-white/20 data-[state=checked]:bg-cosmic-orange data-[state=checked]:border-cosmic-orange"
            />
            <label htmlFor="remember" className="text-sm text-white/60 cursor-pointer">
              Remember me for 7 days
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-cosmic-orange text-black font-bold hover:bg-cosmic-orange/90 orange-glow"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative px-4 bg-deep-charcoal text-white/40 text-xs uppercase tracking-widest">
            {selectedRole === 'customer' || selectedRole === 'merchant' ? 'New to CosmicStore?' : 'Contact admin for access'}
          </span>
        </div>

        {/* Sign Up Link (only for customer/merchant) */}
        {(selectedRole === 'customer' || selectedRole === 'merchant') && (
          <Button asChild variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/5 group">
            <Link href={`/auth/signup?role=${selectedRole}`}>
              Create {roleConfig[selectedRole].label} Account
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        )}

        {/* Info for support/admin */}
        {(selectedRole === 'support' || selectedRole === 'admin') && (
          <p className="text-center text-sm text-white/40">
            {selectedRole === 'support' ? 'Support' : 'Admin'} accounts are created by system administrators.
            Contact your admin if you need access.
          </p>
        )}
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cosmic-orange" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
