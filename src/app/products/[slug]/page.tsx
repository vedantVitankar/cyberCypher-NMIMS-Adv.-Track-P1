import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Star, Heart, ShieldCheck, Truck, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddToCartButton from '@/components/AddToCartButton';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  // Fetch product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!product) {
    notFound();
  }

  // Fetch category separately if product has a category_id
  let category = null;
  if (product.category_id) {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', product.category_id)
      .single();
    category = categoryData;
  }

  // Add category to product object for compatibility
  const productWithCategory = { ...product, category };

  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-white/50">
        <Link href="/" className="hover:text-cosmic-orange transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-cosmic-orange transition-colors">Products</Link>
        <ChevronRight className="h-4 w-4" />
        {productWithCategory.category && (
          <>
            <Link href={`/products?category=${productWithCategory.category.slug}`} className="hover:text-cosmic-orange transition-colors">
              {productWithCategory.category.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-white truncate max-w-[200px]">{productWithCategory.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-deep-charcoal">
            <Image
              src={productWithCategory.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800'}
              alt={productWithCategory.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {(productWithCategory.images || []).map((img: string, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-deep-charcoal cursor-pointer hover:border-cosmic-orange transition-all">
                <Image src={img} alt={`${productWithCategory.name} ${i}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <div className="mb-6">
            <Badge className="mb-4 bg-cosmic-orange/10 text-cosmic-orange border-cosmic-orange/30">
              {productWithCategory.brand}
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              {productWithCategory.name}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-cosmic-orange">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(productWithCategory.rating) ? 'fill-current' : 'text-white/20'}`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold">{productWithCategory.rating}</span>
              </div>
              <span className="text-white/40 text-sm">|</span>
              <span className="text-white/40 text-sm">{productWithCategory.review_count} Reviews</span>
              <span className="text-white/40 text-sm">|</span>
              <span className={productWithCategory.stock_quantity > 0 ? "text-green-500 text-sm font-medium" : "text-red-500 text-sm font-medium"}>
                {productWithCategory.stock_quantity > 0 ? `In Stock (${productWithCategory.stock_quantity} available)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-bold text-white">${productWithCategory.price}</span>
              {productWithCategory.compare_at_price && (
                <span className="text-xl text-white/40 line-through mb-1">${productWithCategory.compare_at_price}</span>
              )}
              {productWithCategory.discount_percentage > 0 && (
                <Badge className="mb-1 bg-green-500/20 text-green-500 border-green-500/30">
                  Save {productWithCategory.discount_percentage}%
                </Badge>
              )}
            </div>
            <p className="text-white/50 text-sm">Free cosmic shipping on orders over $500</p>
          </div>

          <p className="text-white/70 mb-8 leading-relaxed">
            {productWithCategory.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <AddToCartButton product={productWithCategory} />
            <Button variant="outline" size="lg" className="flex-1 border-white/10 text-white hover:bg-white/5 h-14">
              <Heart className="mr-2 h-5 w-5" />
              Add to Wishlist
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8 border-t border-white/5">
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5">
              <Truck className="h-6 w-6 text-cosmic-orange mb-2" />
              <span className="text-xs font-bold text-white">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5">
              <ShieldCheck className="h-6 w-6 text-cosmic-orange mb-2" />
              <span className="text-xs font-bold text-white">1 Year Warranty</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5">
              <RefreshCw className="h-6 w-6 text-cosmic-orange mb-2" />
              <span className="text-xs font-bold text-white">30 Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-24">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="bg-deep-charcoal border-white/10 w-full justify-start overflow-x-auto">
            <TabsTrigger value="description" className="data-[state=active]:bg-cosmic-orange data-[state=active]:text-black">Description</TabsTrigger>
            <TabsTrigger value="specifications" className="data-[state=active]:bg-cosmic-orange data-[state=active]:text-black">Specifications</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-cosmic-orange data-[state=active]:text-black">Reviews ({productWithCategory.review_count})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-8 text-white/70 leading-relaxed">
            <h3 className="text-xl font-bold text-white mb-4">Product Overview</h3>
            <p>{productWithCategory.description}</p>
            <ul className="mt-6 space-y-2 list-disc list-inside">
              <li>Engineered for high-performance usage</li>
              <li>Sleek cosmic design with premium materials</li>
              <li>Integrated AI capabilities for smarter processing</li>
              <li>Optimized for the modern workspace</li>
            </ul>
          </TabsContent>
          <TabsContent value="specifications" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries((productWithCategory.specifications || {}) as Record<string, string>).map(([key, value]) => (
                <div key={key} className="flex justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-white/40 font-medium capitalize">{key.replace('_', ' ')}</span>
                  <span className="text-white font-semibold">{value}</span>
                </div>
              ))}
              {/* Fallback if no specs */}
              {Object.keys((productWithCategory.specifications || {}) as object).length === 0 && (
                <p className="text-white/40 col-span-2 italic">No detailed specifications available for this product.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-8">
             <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl">
                <Star className="h-12 w-12 text-white/10 mb-4" />
                <h4 className="text-lg font-bold text-white">No reviews yet</h4>
                <p className="text-white/50 max-w-xs mx-auto">Be the first to share your experience with the {productWithCategory.name}.</p>
                <Button className="mt-6 border-cosmic-orange text-cosmic-orange hover:bg-cosmic-orange hover:text-black" variant="outline">Write a Review</Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-8">Related <span className="text-cosmic-orange">Cosmic Items</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
