'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, Loader2, Package, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      router.push('/');
      router.refresh();
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Redirect if not logged in
  if (!isLoading && !user) {
    router.push('/auth/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cosmic-orange" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">User <span className="text-cosmic-orange">Profile</span></h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="p-8 rounded-3xl bg-deep-charcoal border border-white/10 text-center">
              <div className="relative inline-block mb-4">
                <div className="h-24 w-24 rounded-full bg-cosmic-orange/20 border-2 border-cosmic-orange flex items-center justify-center">
                  <User className="h-12 w-12 text-cosmic-orange" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{user.full_name || 'Cosmic Explorer'}</h2>
              <p className="text-white/40 text-sm mb-6">{user.email}</p>
              <Button
                variant="outline"
                className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-3 text-white/60">
                <Shield className="h-4 w-4 text-cosmic-orange" />
                <span className="text-xs font-semibold uppercase tracking-wider">Account Status</span>
              </div>
              <p className="text-sm text-white">Verified Cosmic Member</p>
            </div>
          </div>

          {/* Profile Content */}
          <div className="md:col-span-2 space-y-8">
            <div className="p-8 rounded-3xl bg-deep-charcoal border border-white/10">
              <h3 className="text-lg font-bold text-white mb-6">Account Information</h3>
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Full Name</label>
                  <p className="text-white font-medium">{user.full_name || 'Not provided'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Email Address</label>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Joined On</label>
                  <p className="text-white font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-deep-charcoal border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Recent Orders</h3>
                <Button asChild variant="ghost" size="sm" className="text-cosmic-orange">
                  <a href="/orders">View All</a>
                </Button>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Package className="h-10 w-10 text-white/10 mb-4" />
                <p className="text-white/40 text-sm">No recent orders found in your orbit.</p>
                <Button asChild className="mt-6 bg-cosmic-orange text-black" size="sm">
                  <a href="/products">Browse Deals</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
