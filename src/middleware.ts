import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/session',
  '/api/auth/signout',
];

// Routes that require specific roles
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/support': ['support', 'admin'],
  '/merchant': ['merchant', 'admin'],
};

// API routes that require specific roles
const API_ROLE_ROUTES: Record<string, string[]> = {
  '/api/admin': ['admin'],
  '/api/agent': ['support', 'admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions (images, etc.)
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route.includes('[')) {
      // Handle dynamic routes like /products/[slug]
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  // For public routes, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get session token from cookie or header
  const token = request.cookies.get('cosmic_session_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // If no token, redirect to login
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For protected routes, validate session via API
  // Note: In production, you might want to use JWT for faster validation
  try {
    const sessionResponse = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!sessionResponse.ok) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Invalid session' },
          { status: 401 }
        );
      }

      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const sessionData = await sessionResponse.json();
    const userRole = sessionData.user?.role;

    // Check role-based access for pages
    for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(routePrefix)) {
        if (!allowedRoles.includes(userRole)) {
          // Redirect to appropriate dashboard based on role
          const dashboards: Record<string, string> = {
            customer: '/',
            merchant: '/merchant',
            support: '/support',
            admin: '/admin',
          };
          return NextResponse.redirect(new URL(dashboards[userRole] || '/', request.url));
        }
      }
    }

    // Check role-based access for API routes
    for (const [routePrefix, allowedRoles] of Object.entries(API_ROLE_ROUTES)) {
      if (pathname.startsWith(routePrefix)) {
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }
    }

    // Add user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', sessionData.user?.id || '');
    response.headers.set('x-user-role', userRole || '');

    return response;
  } catch (error) {
    console.error('Middleware session validation error:', error);

    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
