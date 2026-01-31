import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import type { SignUpRequest } from '@/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.full_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Restrict admin/support signup (must be created by admin)
    if (body.role === 'admin' || body.role === 'support') {
      return NextResponse.json(
        { success: false, error: 'Admin and support accounts must be created by an administrator' },
        { status: 403 }
      );
    }

    const result = await authService.signUp(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // If signup successful and no verification required, create session
    if (result.user && !result.requires_verification) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;

      // Note: In production, automatically sign in after signup might not be desired
      // depending on whether email verification is required
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Signup route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
