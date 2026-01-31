'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Package, Search, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setOrders(data || []);
      setIsLoading(false);
    };

    getOrders();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cosmic-orange" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        asChild
        className="mb-6 text-white/60 hover:text-white hover:bg-white/5"
      >
        <Link href="/profile">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
      </Button>

      <h1 className="text-3xl font-bold text-white mb-8">My <span className="text-cosmic-orange">Orders</span></h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl bg-deep-charcoal border border-white/10">
          <div className="mb-6 rounded-full bg-white/5 p-8">
            <Package className="h-16 w-16 text-white/20" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No orders found</h2>
          <p className="text-white/50 max-w-sm mb-8">You haven't made any cosmic purchases yet. Your future treasures are waiting!</p>
          <Button asChild size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90">
            <Link href="/products">Shop Cosmic Deals</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="p-6 rounded-2xl bg-deep-charcoal border border-white/10 hover:border-cosmic-orange/30 transition-all group">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="space-y-1">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Order ID</p>
                  <p className="text-sm font-mono text-white">#{order.id.slice(-12).toUpperCase()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Date Placed</p>
                  <p className="text-sm text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Total Amount</p>
                  <p className="text-sm font-bold text-cosmic-orange">${order.total_amount.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Status</p>
                  <Badge className={
                    order.status === 'delivered' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                    order.status === 'shipped' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                    'bg-cosmic-orange/20 text-cosmic-orange border-cosmic-orange/30'
                  }>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                      <Package className="h-6 w-6" />
                   </div>
                   <p className="text-sm text-white/70">Click to view order details and tracking</p>
                </div>
                <Button variant="ghost" size="icon" className="text-white group-hover:text-cosmic-orange transition-colors">
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
