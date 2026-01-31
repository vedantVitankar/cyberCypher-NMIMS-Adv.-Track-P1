'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/types';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product, className }) => {
  const { addToCart } = useCart();

  return (
    <Button
      onClick={() => addToCart(product)}
      size="lg"
      className={`flex-1 bg-cosmic-orange text-black hover:bg-cosmic-orange/90 h-14 font-bold orange-glow ${className}`}
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      Add to Cart
    </Button>
  );
};

export default AddToCartButton;
