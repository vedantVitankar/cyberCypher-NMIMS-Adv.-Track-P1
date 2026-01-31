'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Orbit, Mail, Lock, Loader2, ArrowRight, User, Store, Phone, Building, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/auth/types';

const SignupPage = () => {
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || 'customer';

  const [selectedRole, setSelectedRole] = useState<'customer' | 'merchant'>(
    initialRole === 'merchant' ? 'merchant' : 'customer'
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    business_name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.full_name) {
      return 'Please fill in all required fields';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(formData.password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(formData.password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(formData.password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      return 'Password must contain at least one special character';
    }
    if (selectedRole === 'merchant' && !formData.business_name) {
      return 'Business name is required for merchant accounts';
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || undefined,
        role: selectedRole,
        business_name: selectedRole === 'merchant' ? formData.business_name : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create account');
      }

      setIsSuccess(true);

      // If verification required, show success message
      if (result.requires_verification) {
        toast.success('Account created! Please check your email to verify your account.');
      } else {
        toast.success('Account created successfully!');
        router.push(selectedRole === 'merchant' ? '/merchant' : '/');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 p-8 rounded-3xl bg-deep-charcoal border border-white/10 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Account Created!</h2>
          <p className="text-white/60">
            We&apos;ve sent a verification email to <span className="text-cosmic-orange">{formData.email}</span>.
            Please check your inbox and click the verification link.
          </p>
          <div className="pt-4 space-y-3">
            <Button asChild className="w-full h-12 bg-cosmic-orange text-black font-bold hover:bg-cosmic-orange/90">
              <Link href="/auth/login">
                Go to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-white/40">
              Didn&apos;t receive the email?{' '}
              <button className="text-cosmic-orange hover:underline">Resend verification</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 p-8 rounded-3xl bg-deep-charcoal border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-cosmic-orange mb-6">
            <Orbit className="h-10 w-10" />
            <span className="text-3xl font-bold tracking-tighter text-white">
              COSMIC<span className="text-cosmic-orange">STORE</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="mt-2 text-white/50 text-sm">Join the cosmic marketplace</p>
        </div>

        {/* Role Selection */}
        <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'customer' | 'merchant')} className="w-full">
          <TabsList className="grid grid-cols-2 bg-cosmic-black/50 p-1">
            <TabsTrigger
              value="customer"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-deep-charcoal"
            >
              <User className="h-4 w-4" />
              <span>Customer</span>
            </TabsTrigger>
            <TabsTrigger
              value="merchant"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-deep-charcoal"
            >
              <Store className="h-4 w-4" />
              <span>Merchant</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-white/60">Full Name *</Label>
            <div className="relative">
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                required
                className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                value={formData.full_name}
                onChange={handleChange}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            </div>
          </div>

          {/* Business Name (Merchant only) */}
          {selectedRole === 'merchant' && (
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-white/60">Business Name *</Label>
              <div className="relative">
                <Input
                  id="business_name"
                  name="business_name"
                  type="text"
                  placeholder="Your Store Name"
                  required
                  className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                  value={formData.business_name}
                  onChange={handleChange}
                />
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/60">Email Address *</Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                value={formData.email}
                onChange={handleChange}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white/60">Phone Number</Label>
            <div className="relative">
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                value={formData.phone}
                onChange={handleChange}
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/60">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                value={formData.password}
                onChange={handleChange}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            </div>
            <p className="text-xs text-white/40">
              Min 8 characters with uppercase, lowercase, number & special character
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white/60">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-white/40 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-cosmic-orange hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-cosmic-orange hover:underline">Privacy Policy</Link>
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-cosmic-orange text-black font-bold hover:bg-cosmic-orange/90 orange-glow"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Create {selectedRole === 'merchant' ? 'Merchant' : 'Customer'} Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative px-4 bg-deep-charcoal text-white/40 text-xs uppercase tracking-widest">
            Already have an account?
          </span>
        </div>

        {/* Sign In Link */}
        <Button asChild variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/5 group">
          <Link href="/auth/login">
            Sign In
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default SignupPage;
