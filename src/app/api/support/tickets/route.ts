import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    let query = `SELECT * FROM support_tickets`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push(`status = ?`);
      params.push(status);
    }

    if (priority) {
      conditions.push(`priority = ?`);
      params.push(priority);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const tickets = db.prepare(query).all(...params);

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
