import React from 'react';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    price?: string;
    rating?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { category, brand, price, rating, search, sort, page = '1' } = params;

  // Build query
  let query = supabase.from('products').select('*', { count: 'exact' });

  if (category) {
    const { data: catData } = await supabase.from('categories').select('id').eq('slug', category).single();
    if (catData) query = query.eq('category_id', catData.id);
  }

  if (brand) {
    const brandList = brand.split(',');
    query = query.in('brand', brandList);
  }

  if (price) {
    const [min, max] = price.split('-').map(Number);
    query = query.gte('price', min).lte('price', max);
  }

  if (rating) {
    query = query.gte('rating', Number(rating));
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Sorting
  switch (sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const pageSize = 12;
  const from = (Number(page) - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: products, count } = await query;

  // Fetch unique brands and categories for sidebar
  const { data: allCategories } = await supabase.from('categories').select('*');
  const { data: brandData } = await supabase.from('products').select('brand');
  const brands = Array.from(new Set(brandData?.map((p) => p.brand).filter(Boolean) as string[]));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterSidebar categories={allCategories || []} brands={brands} />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Controls Bar */}
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-white/10 bg-deep-charcoal p-4">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden border-white/10 text-white">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-cosmic-black border-white/10 text-white overflow-y-auto">
                  <div className="py-8">
                    <FilterSidebar categories={allCategories || []} brands={brands} />
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-sm font-medium text-white/60">
                Showing <span className="text-white">{(products?.length || 0)}</span> of <span className="text-white">{count || 0}</span> products
                {category && <span className="ml-1">in <span className="text-cosmic-orange">{category}</span></span>}
              </h1>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Select defaultValue={sort || 'newest'}>
                <SelectTrigger className="w-full sm:w-48 bg-cosmic-black border-white/10 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-deep-charcoal border-white/10 text-white">
                  <SelectItem value="newest">Latest Arrivals</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 rounded-full bg-white/5 p-6">
                <Search className="h-12 w-12 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white">No cosmic entities found</h3>
              <p className="mt-2 text-white/50">Try adjusting your filters or search query to find what you're looking for.</p>
              <Button asChild className="mt-8 bg-cosmic-orange text-black">
                <a href="/products">Clear All Filters</a>
              </Button>
            </div>
          )}
          
          {/* Pagination (Simple) */}
          {count && count > pageSize && (
            <div className="mt-12 flex justify-center gap-4">
              <Button
                variant="outline"
                className="border-white/10 text-white"
                disabled={Number(page) <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="border-white/10 text-white"
                disabled={Number(page) * pageSize >= count}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
