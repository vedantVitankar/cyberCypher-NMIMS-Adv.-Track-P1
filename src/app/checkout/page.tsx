'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { useCart } from '@/context/CartContext';
import { CheckoutForm } from '@/components/CheckoutForm';
import { ArrowLeft, ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, cartCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shipping = cartTotal > 500 ? 0 : 50;
  const tax = cartTotal * 0.08;
  const grandTotal = cartTotal + shipping + tax;
  const amountInCents = Math.round(grandTotal * 100);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-48 mx-auto mb-8" />
          <div className="h-96 bg-white/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-white/5 p-8">
            <Lock className="h-16 w-16 text-white/20" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-white">Your cart is empty</h1>
        <p className="mb-8 text-white/50">Add items to your cart before checkout.</p>
        <Button asChild size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const stripeOptions = {
    mode: 'payment' as const,
    amount: amountInCents,
    currency: 'usd',
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#e87400',
        colorBackground: '#1a1a1a',
        colorText: '#ffffff',
        colorTextSecondary: '#a0a0a0',
        colorDanger: '#ff5555',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          backgroundColor: '#0d0d0d',
          border: '1px solid #333',
        },
        '.Input:focus': {
          border: '1px solid #e87400',
          boxShadow: '0 0 0 1px #e87400',
        },
        '.Label': {
          color: '#a0a0a0',
        },
        '.Tab': {
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
        },
        '.Tab--selected': {
          backgroundColor: '#262626',
          borderColor: '#e87400',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-cosmic-black">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          asChild
          className="mb-6 text-white/60 hover:text-white hover:bg-white/5"
        >
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>

        <h1 className="mb-8 text-3xl font-bold text-white">
          Secure <span className="text-cosmic-orange">Checkout</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-deep-charcoal border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Payment Details</h2>
              <Elements stripe={stripePromise} options={stripeOptions}>
                <CheckoutForm amount={amountInCents} />
              </Elements>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/5">
                <ShieldCheck className="h-6 w-6 text-cosmic-orange mb-2" />
                <span className="text-xs text-white/60 text-center">256-bit SSL</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/5">
                <Truck className="h-6 w-6 text-cosmic-orange mb-2" />
                <span className="text-xs text-white/60 text-center">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/5">
                <RotateCcw className="h-6 w-6 text-cosmic-orange mb-2" />
                <span className="text-xs text-white/60 text-center">30-Day Returns</span>
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-24 p-6 rounded-2xl bg-deep-charcoal border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                      <Image
                        src={item.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{item.name}</h3>
                      <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="bg-white/10 my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-500 font-medium">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between text-lg font-bold text-white pt-2">
                  <span>Total</span>
                  <span className="text-cosmic-orange orange-text-glow">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-white/40">
                <Lock className="h-3 w-3" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
