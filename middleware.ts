import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes (dashboard and all sub-routes)
  if (pathname.startsWith('/dashboard') || pathname === '/admin' || pathname === '/sources' || pathname === '/history' || pathname === '/insights' || pathname === '/settings') {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // No token - redirect to auth page
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      // Invalid token - redirect to auth page
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // For admin routes, check if user is admin
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      // We can't check the user role here without a DB call
      // This will be handled in the admin page component
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
