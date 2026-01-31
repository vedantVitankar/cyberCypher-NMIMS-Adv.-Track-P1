'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

const WishlistPage = () => {
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-white/5 p-8">
            <Heart className="h-16 w-16 text-white/20" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-white">Your wishlist is empty</h1>
        <p className="mb-8 text-white/50">Save cosmic items you love and they will appear here.</p>
        <Button asChild size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90">
          <Link href="/products">Explore Cosmic Gear</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            My <span className="text-cosmic-orange">Wishlist</span>
          </h1>
          <p className="mt-2 text-white/50">You have {wishlist.length} items saved in your cosmic collection.</p>
        </div>
        <Button asChild variant="outline" className="border-white/10 text-white hover:bg-white/5">
          <Link href="/cart">
            Go to Cart
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
