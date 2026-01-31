import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import HeroSliderWrapper from "@/components/HeroSliderWrapper";
import { Button } from "@/components/ui/button";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import Zap from "lucide-react/dist/esm/icons/zap";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Globe from "lucide-react/dist/esm/icons/globe";

async function getCategories() {
  const { data } = await supabase.from('categories').select('*').limit(4);
  return data || [];
}

async function getFeaturedProducts() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .limit(4);
  return data || [];
}

async function getLatestProducts() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4);
  return data || [];
}

export default async function Home() {
  const categories = await getCategories();
  const featuredProducts = await getFeaturedProducts();
  const latestProducts = await getLatestProducts();

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <HeroSliderWrapper />

      {/* Features Bar */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-cosmic-orange/10 text-cosmic-orange"><Rocket className="h-6 w-6" /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Delivery</h4>
              <p className="text-xs text-white/40">Across the galaxy</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-cosmic-orange/10 text-cosmic-orange"><Zap className="h-6 w-6" /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Instant Support</h4>
              <p className="text-xs text-white/40">24/7 AI Assistance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-cosmic-orange/10 text-cosmic-orange"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Secure Payments</h4>
              <p className="text-xs text-white/40">Encrypted transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-cosmic-orange/10 text-cosmic-orange"><Globe className="h-6 w-6" /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Global Reach</h4>
              <p className="text-xs text-white/40">Worldwide shipping</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Cosmic <span className="text-cosmic-orange">Categories</span></h2>
            <p className="mt-2 text-white/50">Curated collections for every orbit</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-cosmic-orange hover:underline underline-offset-4">
            View All Categories →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Nebula <span className="text-cosmic-orange">Deals</span></h2>
            <p className="mt-2 text-white/50">Top-rated tech at unbeatable prices</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-cosmic-orange hover:underline underline-offset-4">
            Shop All Featured →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-deep-charcoal border border-white/5 p-8 lg:p-16">
          <div className="absolute top-0 right-0 h-full w-1/2 opacity-20 pointer-events-none">
            <div className="h-full w-full bg-[radial-gradient(circle_at_center,var(--color-cosmic-orange)_0%,transparent_70%)] blur-3xl" />
          </div>
          <div className="relative z-10 max-w-xl">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-5xl">
              Upgrade Your <span className="text-cosmic-orange">Astro Gear</span>
            </h2>
            <p className="mb-8 text-lg text-white/60">
              Get an extra 15% off on all wearable technology this week. Use code <span className="text-cosmic-orange font-mono">ASTRO15</span> at checkout.
            </p>
            <Button size="lg" className="bg-cosmic-orange text-black hover:bg-cosmic-orange/90">
              Claim Offer Now
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Arrivals */}
      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Latest <span className="text-cosmic-orange">Arrivals</span></h2>
            <p className="mt-2 text-white/50">New discoveries added daily</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-cosmic-orange hover:underline underline-offset-4">
            Browse New →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>
      {children}
    </span>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
