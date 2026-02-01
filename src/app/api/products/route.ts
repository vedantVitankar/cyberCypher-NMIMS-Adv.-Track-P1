import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchant_id');
    const categoryId = searchParams.get('category_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    let query = `SELECT * FROM products`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (merchantId) {
      conditions.push(`merchant_id = ?`);
      params.push(merchantId);
    }

    if (categoryId) {
      conditions.push(`category_id = ?`);
      params.push(categoryId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const products = db.prepare(query).all(...params);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
