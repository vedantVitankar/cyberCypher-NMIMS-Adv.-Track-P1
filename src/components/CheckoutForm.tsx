'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, MapPin } from 'lucide-react';

interface CheckoutFormProps {
  amount: number;
}

export function CheckoutForm({ amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [isAddressReady, setIsAddressReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Validation failed');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          metadata: {
            itemCount: cart.length,
            items: JSON.stringify(cart.map((item) => ({ id: item.id, qty: item.quantity }))),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setIsLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        clearCart();
        router.push(`/checkout/success?payment_intent=${paymentIntent.id}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      setIsLoading(false);
    }
  };

  const isFormReady = stripe && elements && isPaymentReady && isAddressReady;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <MapPin className="h-4 w-4" />
          <span>Shipping Address</span>
        </div>
        <div className="max-h-[280px] overflow-y-auto rounded-lg">
          <AddressElement
            options={{
              mode: 'shipping',
              allowedCountries: ['US', 'CA', 'GB', 'AU'],
              fields: {
                phone: 'always',
              },
              validation: {
                phone: {
                  required: 'always',
                },
              },
            }}
            onReady={() => setIsAddressReady(true)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <CreditCard className="h-4 w-4" />
          <span>Payment Method</span>
        </div>
        <div className="max-h-[320px] overflow-y-auto rounded-lg">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
            onReady={() => setIsPaymentReady(true)}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!isFormReady || isLoading}
        className="w-full h-14 bg-cosmic-orange text-black hover:bg-cosmic-orange/90 font-bold text-lg orange-glow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </Button>
    </form>
  );
}
