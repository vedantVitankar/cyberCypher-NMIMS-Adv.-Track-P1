'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Orbit, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created! Please check your email for verification.');
        router.push('/auth/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 p-8 rounded-3xl bg-deep-charcoal border border-white/10 shadow-2xl">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-cosmic-orange mb-6">
            <Orbit className="h-10 w-10" />
            <span className="text-3xl font-bold tracking-tighter text-white">
              COSMIC<span className="text-cosmic-orange">STORE</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Join the Cosmos</h2>
          <p className="mt-2 text-white/50 text-sm">Create your cosmic account today</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white/60">Full Name</Label>
            <div className="relative">
              <Input
                id="fullName"
                type="text"
                placeholder="Astro Explorer"
                required
                className="bg-cosmic-black border-white/10 pl-10 h-12 focus:border-cosmic-orange"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
            </div>
          </div>

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
            <Label htmlFor="password" className="text-white/60">Password</Label>
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-cosmic-orange text-black font-bold hover:bg-cosmic-orange/90 orange-glow"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
          </Button>
        </form>

        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative px-4 bg-deep-charcoal text-white/40 text-xs uppercase tracking-widest">Already a member?</span>
        </div>

        <Button asChild variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/5 group">
          <Link href="/auth/login">
            Sign In Instead
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default SignupPage;
