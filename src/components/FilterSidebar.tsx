'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Star } from 'lucide-react';
import { Category } from '@/lib/types';

interface FilterSidebarProps {
  categories: Category[];
  brands: string[];
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ categories, brands }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category');
  const currentBrands = searchParams.get('brand')?.split(',') || [];
  const currentPriceRange = searchParams.get('price')?.split('-').map(Number) || [0, 5000];
  const currentRating = Number(searchParams.get('rating')) || 0;

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleBrandToggle = (brand: string) => {
    let newBrands = [...currentBrands];
    if (newBrands.includes(brand)) {
      newBrands = newBrands.filter((b) => b !== brand);
    } else {
      newBrands.push(brand);
    }
    updateFilters('brand', newBrands.length > 0 ? newBrands.join(',') : null);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Category</h3>
        <div className="space-y-2">
          <div
            className={`cursor-pointer text-sm transition-colors ${!currentCategory ? 'text-cosmic-orange font-bold' : 'text-white/60 hover:text-white'}`}
            onClick={() => updateFilters('category', null)}
          >
            All Categories
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`cursor-pointer text-sm transition-colors ${currentCategory === cat.slug ? 'text-cosmic-orange font-bold' : 'text-white/60 hover:text-white'}`}
              onClick={() => updateFilters('category', cat.slug)}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Brand</h3>
        <div className="space-y-3">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={currentBrands.includes(brand)}
                onCheckedChange={() => handleBrandToggle(brand)}
                className="border-white/20 data-[state=checked]:bg-cosmic-orange data-[state=checked]:border-cosmic-orange"
              />
              <Label
                htmlFor={`brand-${brand}`}
                className="text-sm text-white/60 cursor-pointer hover:text-white transition-colors"
              >
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Price Range</h3>
        <div className="px-2">
          <Slider
            defaultValue={[currentPriceRange[0], currentPriceRange[1]]}
            max={5000}
            step={10}
            onValueChange={(vals) => updateFilters('price', `${vals[0]}-${vals[1]}`)}
            className="mb-4"
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>${currentPriceRange[0]}</span>
            <span>${currentPriceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Ratings */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Customer Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div
              key={rating}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${currentRating === rating ? 'text-cosmic-orange' : 'text-white/60 hover:text-white'}`}
              onClick={() => updateFilters('rating', currentRating === rating ? null : rating.toString())}
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < rating ? 'fill-current text-cosmic-orange' : 'text-white/10'}`}
                  />
                ))}
              </div>
              <span className="text-xs">& Up</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
