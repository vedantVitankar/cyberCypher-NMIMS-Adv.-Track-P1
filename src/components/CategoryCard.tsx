import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, className }) => {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-deep-charcoal transition-all hover:border-cosmic-orange/50 hover:shadow-[0_0_30px_rgba(255,127,0,0.15)]",
        className
      )}
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        <Image
          src={category.image_url || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=500'}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity group-hover:via-black/50" />
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-6 transition-transform duration-300 group-hover:-translate-y-1">
        <h3 className="text-xl font-bold text-white group-hover:text-cosmic-orange transition-colors">
          {category.name}
        </h3>
        <p className="mt-2 text-sm text-white/60 line-clamp-2">
          {category.description}
        </p>
        <div className="mt-4 flex items-center text-xs font-semibold text-cosmic-orange uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100">
          Explore Collection →
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
