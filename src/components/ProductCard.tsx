'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Star from 'lucide-react/dist/esm/icons/star';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import Heart from 'lucide-react/dist/esm/icons/heart';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorite = isInWishlist(product.id);

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-deep-charcoal transition-all hover:border-cosmic-orange/50 hover:shadow-[0_0_20px_rgba(255,127,0,0.1)]",
      className
    )}>
      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product);
        }}
        className={cn(
          "absolute right-3 top-3 z-10 rounded-full p-2 backdrop-blur-md transition-all",
          isFavorite ? "bg-cosmic-orange text-black" : "bg-black/20 text-white hover:bg-white/10"
        )}
      >
        <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
      </button>

      {/* Discount Badge */}
      {product.discount_percentage > 0 && (
        <Badge className="absolute left-3 top-3 z-10 bg-cosmic-orange text-black hover:bg-cosmic-orange">
          -{product.discount_percentage}%
        </Badge>
      )}

      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden">
        <Image
          src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center text-cosmic-orange">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.floor(product.rating) ? "fill-current" : "text-white/20"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-white/40">({product.review_count})</span>
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="mb-1 line-clamp-2 text-sm font-medium text-white group-hover:text-cosmic-orange transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="mb-4 text-xs text-white/50">{product.brand}</p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">${product.price}</span>
            {product.compare_at_price && (
              <span className="text-xs text-white/40 line-through">${product.compare_at_price}</span>
            )}
          </div>
          <Button
            size="icon"
            onClick={() => addToCart(product)}
            className="h-9 w-9 rounded-full bg-cosmic-orange text-black hover:bg-cosmic-orange/90 transition-transform hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
