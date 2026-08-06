import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/home', '/settings', '/receipts', '/statistics'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected) {
    const refreshToken = request.cookies.get('refreshToken');
    if (!refreshToken) {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }
    return NextResponse.next();
  }

  // Root: skip the /welcome landing page for an already-signed-in visitor
  // (the actual session — not just cookie presence — still gets verified
  // client-side on /home, same as any other protected route).
  if (pathname === '/') {
    const refreshToken = request.cookies.get('refreshToken');
    return NextResponse.redirect(new URL(refreshToken ? '/home' : '/welcome', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/home/:path*', '/settings/:path*', '/receipts/:path*', '/statistics/:path*'],
};
