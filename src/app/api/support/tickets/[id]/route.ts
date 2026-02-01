import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, resolution, agent_response } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (agent_response) {
      updates.push('agent_response = ?');
      values.push(agent_response);
      updates.push('resolved_by = ?');
      values.push('agent');
    }

    if (updates.length === 0) {
      return NextResponse.json({ ticket: null });
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id); // For WHERE clause

    const query = `
      UPDATE support_tickets 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    db.prepare(query).run(...values);

    const updatedTicket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
