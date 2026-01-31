'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Search from 'lucide-react/dist/esm/icons/search';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import Heart from 'lucide-react/dist/esm/icons/heart';
import User from 'lucide-react/dist/esm/icons/user';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import Orbit from 'lucide-react/dist/esm/icons/orbit';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-cosmic-black/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        {/* Top Header */}
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-cosmic-orange transition-transform hover:scale-105">
            <Orbit className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tighter text-white sm:text-2xl">
              COSMIC<span className="text-cosmic-orange">STORE</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-2xl lg:flex">
            <div className="relative w-full group">
              <Input
                type="search"
                placeholder="Search cosmic deals..."
                className="w-full bg-deep-charcoal border-white/10 pl-10 focus:border-cosmic-orange focus:ring-cosmic-orange/20 transition-all group-hover:border-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 group-hover:text-cosmic-orange transition-colors" />
            </div>
          </form>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative text-white hover:text-cosmic-orange hover:bg-white/5">
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-cosmic-orange text-black border-none text-[10px]">
                    {wishlist.length}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative text-white hover:text-cosmic-orange hover:bg-white/5">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-cosmic-orange text-black border-none text-[10px]">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:text-cosmic-orange hover:bg-white/5">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-deep-charcoal border-white/10 text-white w-48">
                <Link href="/auth/login"><DropdownMenuItem className="cursor-pointer hover:bg-white/5">Login</DropdownMenuItem></Link>
                <Link href="/auth/signup"><DropdownMenuItem className="cursor-pointer hover:bg-white/5">Sign Up</DropdownMenuItem></Link>
                <Link href="/profile"><DropdownMenuItem className="cursor-pointer hover:bg-white/5">My Profile</DropdownMenuItem></Link>
                <Link href="/orders"><DropdownMenuItem className="cursor-pointer hover:bg-white/5">My Orders</DropdownMenuItem></Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:text-cosmic-orange hover:bg-white/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search & Nav */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full bg-deep-charcoal border-white/10 pl-10 focus:border-cosmic-orange"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            </form>
            <div className="flex flex-col gap-2">
              <Link href="/products" className="px-2 py-2 text-white hover:text-cosmic-orange transition-colors">All Products</Link>
              <Link href="/products?category=electronics" className="px-2 py-2 text-white hover:text-cosmic-orange transition-colors">Electronics</Link>
              <Link href="/products?category=computing" className="px-2 py-2 text-white hover:text-cosmic-orange transition-colors">Computing</Link>
              <Link href="/products?category=home-appliances" className="px-2 py-2 text-white hover:text-cosmic-orange transition-colors">Appliances</Link>
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="hidden lg:flex h-10 items-center gap-6 text-sm">
          <Link href="/products" className="text-white/70 hover:text-cosmic-orange transition-colors font-medium">All Deals</Link>
          <Link href="/products?category=electronics" className="text-white/70 hover:text-cosmic-orange transition-colors">Electronics</Link>
          <Link href="/products?category=computing" className="text-white/70 hover:text-cosmic-orange transition-colors">Computing</Link>
          <Link href="/products?category=home-appliances" className="text-white/70 hover:text-cosmic-orange transition-colors">Home Appliances</Link>
          <Link href="/products?category=fashion" className="text-white/70 hover:text-cosmic-orange transition-colors">Fashion</Link>
          <div className="flex-1" />
          <span className="text-cosmic-orange font-semibold animate-pulse">Flash Sale: 40% OFF - Cosmic S24 Ultra</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
