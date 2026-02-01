'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const navigation = [
    { name: 'Overview', href: '/merchant', icon: LayoutDashboard },
    { name: 'Products', href: '/merchant/products', icon: Package },
    { name: 'Orders', href: '/merchant/orders', icon: ShoppingBag },
    { name: 'Settings', href: '/merchant/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-950">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col border-r border-neutral-800 bg-neutral-900 md:flex">
        <div className="flex h-16 items-center px-6 border-b border-neutral-800">
          <span className="text-lg font-bold text-neutral-100">Merchant Portal</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-800 p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-neutral-400 hover:text-red-400"
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center border-b border-neutral-800 bg-neutral-900/50 px-6 backdrop-blur-sm md:hidden">
           {/* Mobile Header (Simplified) */}
           <span className="font-bold text-neutral-100">Merchant Portal</span>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
