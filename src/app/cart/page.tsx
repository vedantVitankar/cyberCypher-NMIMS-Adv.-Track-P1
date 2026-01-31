'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  const shipping = cartTotal > 500 ? 0 : 50;
  const tax = cartTotal * 0.08;
  const grandTotal = cartTotal + shipping + tax;

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-white/5 p-8">
            <ShoppingCart className="h-16 w-16 text-white/20" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-white">Your cosmic cart is empty</h1>
        <p className="mb-8 text-white/50">Looks like you haven't added any galactic items yet.</p>
        <Button asChild size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-white">
        Shopping <span className="text-cosmic-orange">Cart</span>
        <span className="ml-4 text-lg font-normal text-white/40">({cartCount} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-deep-charcoal border border-white/10 group">
              <Link href={`/products/${item.slug}`} className="relative aspect-square w-full sm:w-32 overflow-hidden rounded-xl bg-black/20">
                <Image
                  src={item.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300'}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
              </Link>
              
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between items-start mb-2">
                  <Link href={`/products/${item.slug}`}>
                    <h3 className="text-lg font-bold text-white group-hover:text-cosmic-orange transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    className="text-white/20 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                
                <p className="text-sm text-white/40 mb-4">{item.brand}</p>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-cosmic-black rounded-lg p-1 border border-white/5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:text-cosmic-orange"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:text-cosmic-orange"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xl font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    {item.quantity > 1 && (
                      <p className="text-xs text-white/40">${item.price} each</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <ShieldCheck className="h-5 w-5 text-cosmic-orange" />
            <p className="text-xs text-white/50">
              Secure cosmic checkout. Your data is encrypted and protected across all dimensions.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-8 rounded-2xl bg-deep-charcoal border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-500 font-medium">FREE</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Total</span>
                <span className="text-cosmic-orange orange-text-glow">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-6">
              <Label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Promo Code</Label>
              <div className="flex gap-2">
                <Input placeholder="Enter code" className="bg-cosmic-black border-white/10 text-white" />
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">Apply</Button>
              </div>
            </div>

            <Button asChild size="lg" className="w-full bg-cosmic-orange text-black hover:bg-cosmic-orange/90 h-14 font-bold orange-glow group">
              <Link href="/checkout" className="flex items-center justify-center">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            
            <div className="mt-6 flex justify-center gap-4 opacity-30 grayscale">
              <Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width={40} height={20} />
              <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width={40} height={20} />
              <Image src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" width={40} height={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
