import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/auth-service';
import type { SignInRequest } from '@/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    const body: SignInRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await authService.signIn(body, ipAddress, userAgent);

    if (!result.success) {
      const status = result.requires_verification || result.requires_2fa ? 403 : 401;
      return NextResponse.json(result, { status });
    }

    // Get user permissions
    let permissions: string[] = [];
    if (result.user) {
      permissions = await authService.getUserPermissions(result.user.id);
    }

    return NextResponse.json({
      ...result,
      permissions,
    });
  } catch (error) {
    console.error('Signin route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
