import Link from 'next/link';
import Orbit from 'lucide-react/dist/esm/icons/orbit';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Twitter from 'lucide-react/dist/esm/icons/twitter';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Github from 'lucide-react/dist/esm/icons/github';

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-cosmic-black pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-cosmic-orange mb-4">
              <Orbit className="h-6 w-6" />
              <span className="text-xl font-bold tracking-tighter text-white">
                COSMIC<span className="text-cosmic-orange">STORE</span>
              </span>
            </Link>
            <p className="text-white/50 text-sm mb-4">
              Your gateway to the most innovative tech and cosmic deals in the universe.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-white/50 hover:text-cosmic-orange transition-colors"><Facebook className="h-5 w-5" /></Link>
              <Link href="#" className="text-white/50 hover:text-cosmic-orange transition-colors"><Twitter className="h-5 w-5" /></Link>
              <Link href="#" className="text-white/50 hover:text-cosmic-orange transition-colors"><Instagram className="h-5 w-5" /></Link>
              <Link href="#" className="text-white/50 hover:text-cosmic-orange transition-colors"><Github className="h-5 w-5" /></Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="/products" className="hover:text-cosmic-orange transition-colors">All Products</Link></li>
              <li><Link href="/products?category=electronics" className="hover:text-cosmic-orange transition-colors">Electronics</Link></li>
              <li><Link href="/products?category=computing" className="hover:text-cosmic-orange transition-colors">Computing</Link></li>
              <li><Link href="/products?category=fashion" className="hover:text-cosmic-orange transition-colors">Fashion</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="/profile" className="hover:text-cosmic-orange transition-colors">My Profile</Link></li>
              <li><Link href="/orders" className="hover:text-cosmic-orange transition-colors">Order History</Link></li>
              <li><Link href="/wishlist" className="hover:text-cosmic-orange transition-colors">Wishlist</Link></li>
              <li><Link href="/cart" className="hover:text-cosmic-orange transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="#" className="hover:text-cosmic-orange transition-colors">Shipping Info</Link></li>
              <li><Link href="#" className="hover:text-cosmic-orange transition-colors">Returns & Refunds</Link></li>
              <li><Link href="#" className="hover:text-cosmic-orange transition-colors">Customer Support</Link></li>
              <li><Link href="#" className="hover:text-cosmic-orange transition-colors">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="#" className="hover:text-cosmic-orange transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-cosmic-orange transition-colors">Sustainability</Link></li>
              <li><Link href="#" className="hover:text-cosmic-orange transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-cosmic-orange transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <p>© 2026 CosmicStore. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
