import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: true }); // Already signed out
    }

    const token = authHeader.substring(7);

    // Invalidate session
    await authService.invalidateSession(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signout route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
