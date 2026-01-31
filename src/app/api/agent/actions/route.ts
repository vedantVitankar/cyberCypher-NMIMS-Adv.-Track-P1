// Agent Actions API - View and manage pending actions
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { actor } from '@/lib/agent';

// Get pending actions
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'pending';

  const { data, error } = await supabase
    .from('agent_actions')
    .select(`
      *,
      incidents (title, severity, type)
    `)
    .eq('approval_status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actions: data });
}

// Approve or reject an action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action_id, decision, rejected_by, rejection_reason, approved_by } = body;

    if (!action_id || !decision) {
      return NextResponse.json(
        { error: 'action_id and decision are required' },
        { status: 400 }
      );
    }

    if (decision === 'approve') {
      const result = await actor.approveAction(action_id, approved_by || 'admin');
      return NextResponse.json({
        success: true,
        message: 'Action approved and executed',
        result,
      });
    } else if (decision === 'reject') {
      await actor.rejectAction(
        action_id,
        rejected_by || 'admin',
        rejection_reason || 'Rejected by admin'
      );
      return NextResponse.json({
        success: true,
        message: 'Action rejected',
      });
    } else {
      return NextResponse.json(
        { error: 'decision must be "approve" or "reject"' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
