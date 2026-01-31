'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, Truck, Home, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Lazy-load framer-motion to avoid adding it to every client bundle immediately


function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    if (paymentIntent) {
      setOrderNumber(paymentIntent.slice(-8).toUpperCase());
    } else {
      setOrderNumber(Math.random().toString(36).slice(-8).toUpperCase());
    }
  }, [paymentIntent]);

  const steps = [
    { icon: CheckCircle2, label: 'Order Confirmed', active: true },
    { icon: Package, label: 'Processing', active: false },
    { icon: Truck, label: 'Shipped', active: false },
    { icon: Home, label: 'Delivered', active: false },
  ];

  const [motionModule, setMotionModule] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    import('framer-motion').then((mod) => {
      if (mounted) setMotionModule(mod);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const Animated = motionModule ? motionModule.motion : null;

  if (!Animated) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-cosmic-orange/30 rounded-full blur-xl animate-pulse" />
              <div className="relative rounded-full bg-cosmic-orange/20 p-6 border border-cosmic-orange/30">
                <CheckCircle2 className="h-16 w-16 text-cosmic-orange" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">Payment <span className="text-cosmic-orange orange-text-glow">Successful!</span></h1>
          <p className="text-white/60 mb-2">Thank you for your order. Your cosmic items are on their way!</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="h-4 w-4 text-cosmic-orange" />
            <span className="text-sm text-white/80">Order #</span>
            <span className="font-mono font-bold text-cosmic-orange">{orderNumber}</span>
          </div>

          <div className="p-6 rounded-2xl bg-deep-charcoal border border-white/10 mb-8">
            <h2 className="text-lg font-semibold text-white mb-6">Order Progress</h2>
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-3 ${step.active ? 'bg-cosmic-orange/20 border-2 border-cosmic-orange' : 'bg-white/5 border border-white/10'}`}>
                      <step.icon className={`h-5 w-5 ${step.active ? 'text-cosmic-orange' : 'text-white/30'}`} />
                    </div>
                    <span className={`text-xs mt-2 ${step.active ? 'text-cosmic-orange font-medium' : 'text-white/40'}`}>{step.label}</span>
                  </div>
                  {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step.active ? 'bg-cosmic-orange/30' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-white/40 mb-6">A confirmation email has been sent with your order details.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90 orange-glow group">
                <Link href="/products">
                  Continue Shopping
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/5">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const M = Animated;

  return (
    <div className="min-h-screen bg-cosmic-black flex items-center justify-center px-4 py-16">
      <M.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl w-full text-center">
        <M.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-cosmic-orange/30 rounded-full blur-xl animate-pulse" />
            <div className="relative rounded-full bg-cosmic-orange/20 p-6 border border-cosmic-orange/30">
              <CheckCircle2 className="h-16 w-16 text-cosmic-orange" />
            </div>
          </div>
        </M.div>

        <M.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h1 className="text-4xl font-bold text-white mb-4">Payment <span className="text-cosmic-orange orange-text-glow">Successful!</span></h1>
          <p className="text-white/60 mb-2">Thank you for your order. Your cosmic items are on their way!</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="h-4 w-4 text-cosmic-orange" />
            <span className="text-sm text-white/80">Order #</span>
            <span className="font-mono font-bold text-cosmic-orange">{orderNumber}</span>
          </div>
        </M.div>

        <M.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="p-6 rounded-2xl bg-deep-charcoal border border-white/10 mb-8">
          <h2 className="text-lg font-semibold text-white mb-6">Order Progress</h2>
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-3 ${step.active ? 'bg-cosmic-orange/20 border-2 border-cosmic-orange' : 'bg-white/5 border border-white/10'}`}>
                    <step.icon className={`h-5 w-5 ${step.active ? 'text-cosmic-orange' : 'text-white/30'}`} />
                  </div>
                  <span className={`text-xs mt-2 ${step.active ? 'text-cosmic-orange font-medium' : 'text-white/40'}`}>{step.label}</span>
                </div>
                {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step.active ? 'bg-cosmic-orange/30' : 'bg-white/10'}`} />}
              </React.Fragment>
            ))}
          </div>
        </M.div>

        <M.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-4">
          <p className="text-sm text-white/40 mb-6">A confirmation email has been sent with your order details.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90 orange-glow group">
              <Link href="/products">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/5">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </M.div>
      </M.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-cosmic-orange border-t-transparent rounded-full" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
