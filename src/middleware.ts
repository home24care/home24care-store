import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, isValidSession } from '@/lib/admin-auth';

/**
 * Gate for /admin.
 *
 * Runs before the route so an unauthenticated request never reaches a page
 * that could render revenue or order data — checking inside the page would
 * still execute the data fetch first.
 *
 * Middleware runs on the edge runtime, so admin-auth.ts uses Web Crypto rather
 * than node:crypto.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get(ADMIN_COOKIE)?.value;
  const authed = await isValidSession(session);

  if (pathname === '/admin/login') {
    if (authed) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  if (!authed) {
    const login = new URL('/admin/login', request.url);
    // Send them back where they were headed once they are in.
    if (pathname !== '/admin') login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  // The dashboard is private data — keep it out of shared caches and out of
  // search results even if a URL leaks.
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
