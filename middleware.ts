import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/home', '/settings', '/receipts'];

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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/settings/:path*', '/receipts/:path*'],
};
