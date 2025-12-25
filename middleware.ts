import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  verifyCustomerSessionToken,
} from './lib/customerSession';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚨 CANONICAL BOOKING FLOW: Redirect /booking → /book
  if (pathname.startsWith('/booking')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/book';
    // Preserve all query parameters
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Only handle customer portal paths here.
  // (Admin/auth logic can be added separately or above with early returns.)
  const isCustomerRoute = pathname.startsWith('/customer');

  if (!isCustomerRoute) {
    return NextResponse.next();
  }

  const isAuthRoute =
    pathname === '/customer/login' || pathname === '/customer/verify';

  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;
  const session = await verifyCustomerSessionToken(token);

  // Not logged in, trying to access protected customer routes → redirect to login
  if (!session && !isAuthRoute) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/customer/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in, trying to access login/verify → redirect to dashboard
  if (session && isAuthRoute) {
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = '/customer/dashboard';
    dashUrl.searchParams.delete('redirect');
    return NextResponse.redirect(dashUrl);
  }

  // Otherwise allow request
  const response = NextResponse.next();
  // Add pathname to headers so layout can check it
  response.headers.set('x-invoke-path', pathname);
  return response;
}

export const config = {
  matcher: [
    '/booking/:path*',  // Redirect legacy booking routes
    '/customer/:path*', // Customer portal auth
  ],
};
