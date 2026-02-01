'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  images: string;
  status: string;
  category_id: string;
}

export default function MerchantProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        // TODO: Replace with specific merchant products endpoint
        // For now, we'll fetch all products and rely on the backend (if we had one) or client filtering
        // But since we just added merchant_id to products, we can filter by that if we had the merchant_id
        // However, standard /api/products usually returns public products.
        // We need a secured endpoint.
        
        const res = await fetch('/api/products');
        if (res.ok) {
           const data = await res.json();
           // In a real app, filtering should happen on server.
           // Here we just show what we get for demo purposes.
           setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-100">Products</h1>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-neutral-100">Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-neutral-400 text-center py-8">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-neutral-400 text-center py-8">No products found.</div>
          ) : (
            <div className="space-y-4">
               {products.map((product) => {
                 let imageUrl = '/placeholder.png';
                 try {
                   const images = JSON.parse(product.images);
                   if (Array.isArray(images) && images.length > 0) imageUrl = images[0];
                 } catch (e) {}

                 return (
                   <div key={product.id} className="flex items-center justify-between p-4 border border-neutral-800 rounded-lg bg-neutral-950/50">
                     <div className="flex items-center gap-4">
                       <div className="relative h-12 w-12 overflow-hidden rounded-md bg-neutral-900">
                         <Image 
                           src={imageUrl} 
                           alt={product.name}
                           fill
                           className="object-cover"
                         />
                       </div>
                       <div>
                         <h3 className="font-medium text-neutral-200">{product.name}</h3>
                         <p className="text-sm text-neutral-500">Stock: {product.stock_quantity}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                       <div className="text-right mr-4">
                         <p className="font-medium text-neutral-200">${product.price}</p>
                       </div>
                       <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-100">
                         <Pencil className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-400">
                         <Trash className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
