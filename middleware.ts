import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  verifyCustomerSessionToken,
} from './lib/customerSession';
import {
  isPathAllowedForBranchScopedAdmin,
  isPathAllowedForBranchScopedAdminApi,
  type AdminSessionPayload,
} from './lib/auth/adminScope';

function parseAdminSession(
  adminSession: string | undefined
): AdminSessionPayload | null {
  if (!adminSession || adminSession === 'true') return null;
  try {
    const s = JSON.parse(adminSession) as AdminSessionPayload;
    return s?.userId ? s : null;
  } catch {
    return null;
  }
}

function isAdminSessionValid(adminSession: string | undefined): boolean {
  if (!adminSession) return false;
  if (adminSession === 'true') {
    return process.env.NODE_ENV !== 'production';
  }
  return Boolean(parseAdminSession(adminSession)?.userId);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Branch-scoped admin API guard (jobs ops only)
  if (pathname.startsWith('/api/admin')) {
    const session = parseAdminSession(req.cookies.get('admin_session')?.value);
    if (session?.isBranchScoped && !isPathAllowedForBranchScopedAdminApi(pathname)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access denied' },
        { status: 403 }
      );
    }
  }

  // 🔐 OPS DASHBOARD — same session as admin
  if (pathname.startsWith('/dashboard')) {
    const adminSessionRaw = req.cookies.get('admin_session')?.value;
    const session = parseAdminSession(adminSessionRaw);
    const isAdminLoggedIn = isAdminSessionValid(adminSessionRaw);
    if (!isAdminLoggedIn) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session?.isBranchScoped) {
      const jobsUrl = req.nextUrl.clone();
      jobsUrl.pathname = '/admin/jobs';
      return NextResponse.redirect(jobsUrl);
    }
  }

  // 🔐 CLEANER PORTAL — shared cleanerId cookie
  const isCleanerRoute =
    pathname.startsWith('/cleaner') || pathname.startsWith('/cleaners');
  if (isCleanerRoute) {
    const cleanerPublicPrefixes = [
      '/cleaners/login',
      '/cleaners/apply',
      '/cleaners/apply/success',
    ];
    const isCleanerPublic =
      cleanerPublicPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
      pathname.startsWith('/verify/certificate');

    const cleanerId = req.cookies.get('cleanerId')?.value;
    if (!cleanerId && !isCleanerPublic) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/cleaners/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (cleanerId && pathname === '/cleaners/login') {
      const jobsUrl = req.nextUrl.clone();
      jobsUrl.pathname = '/cleaner/jobs';
      jobsUrl.searchParams.delete('redirect');
      return NextResponse.redirect(jobsUrl);
    }
  }

  // 🔐 ADMIN ROUTE PROTECTION
  if (pathname.startsWith('/admin')) {
    const isLoginRoute = pathname === '/admin/login';
    const adminSessionRaw = req.cookies.get('admin_session')?.value;
    const session = parseAdminSession(adminSessionRaw);
    const isAdminLoggedIn = isAdminSessionValid(adminSessionRaw);

    if (!isAdminLoggedIn && !isLoginRoute) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }
    if (isAdminLoggedIn && isLoginRoute) {
      const dashUrl = req.nextUrl.clone();
      dashUrl.pathname = session?.isBranchScoped ? '/admin/jobs' : '/admin';
      return NextResponse.redirect(dashUrl);
    }

    if (session?.isBranchScoped && !isPathAllowedForBranchScopedAdmin(pathname)) {
      const jobsUrl = req.nextUrl.clone();
      jobsUrl.pathname = '/admin/jobs';
      return NextResponse.redirect(jobsUrl);
    }

    const response = NextResponse.next();
    response.headers.set('x-invoke-path', pathname);
    return response;
  }

  // 🚫 OPTIONAL: block other private sections in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    if (
      pathname.startsWith('/branch-owner') ||
      pathname.startsWith('/pilot')
    ) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // 🚨 CANONICAL BOOKING FLOW: Redirect /booking → /book
  if (pathname.startsWith('/booking')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/book';
    // Preserve all query parameters
    return NextResponse.redirect(redirectUrl, 301);
  }

  // 🔐 SaaS ROUTE PROTECTION
  if (pathname.startsWith('/saas')) {
    const isAuthRoute = pathname === '/saas/login' || pathname === '/saas/signup' || pathname === '/saas/signup/success';
    const saasToken = req.cookies.get('saas_token')?.value;
    const saasUserId = req.cookies.get('saas_user_id')?.value; // Legacy support
    
    console.log(`\n[MIDDLEWARE] Path: ${pathname}, Token found: ${!!saasToken}, Legacy user ID: ${!!saasUserId}, Is auth route: ${isAuthRoute}`);

    // Not logged in, trying to access protected SaaS routes → redirect to login
    if (!saasToken && !saasUserId && !isAuthRoute) {
      console.log('[MIDDLEWARE] No token, redirecting to login.');
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/saas/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If token exists, verify it
    if (saasToken && !isAuthRoute) {
      try {
        const { verifyToken } = await import('@/lib/auth/jwt');
        const payload = await verifyToken(saasToken);
        if (payload) {
          console.log('[MIDDLEWARE] JWT verification successful. Payload:', {
            userId: payload.userId,
            email: payload.email,
            tenantId: payload.tenantId,
            role: payload.role,
          });
        } else {
          console.error('[MIDDLEWARE] JWT verification failed. Token invalid or expired.');
          // Clear invalid token and redirect
          const loginUrl = req.nextUrl.clone();
          loginUrl.pathname = '/saas/login';
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete('saas_token');
          return response;
        }
      } catch (error) {
        console.error('[MIDDLEWARE] JWT verification error. Redirecting to login.', error);
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/saas/login';
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('saas_token');
        return response;
      }
    }

    // Logged in, trying to access login/signup → redirect to dashboard
    if ((saasToken || saasUserId) && isAuthRoute) {
      console.log('[MIDDLEWARE] User already logged in, redirecting to dashboard.');
      const dashUrl = req.nextUrl.clone();
      dashUrl.pathname = '/saas/dashboard';
      dashUrl.searchParams.delete('redirect');
      return NextResponse.redirect(dashUrl);
    }
  }

  // Guest tip flow — public, no customer session required
  if (pathname === '/customer/tip' || pathname.startsWith('/customer/tip/')) {
    const tipUrl = req.nextUrl.clone();
    tipUrl.pathname = '/tip';
    return NextResponse.redirect(tipUrl);
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

  // Logged in, trying to access login/verify → redirect to jobs home
  if (session && isAuthRoute) {
    const jobsUrl = req.nextUrl.clone();
    jobsUrl.pathname = '/customer/jobs';
    jobsUrl.searchParams.delete('redirect');
    return NextResponse.redirect(jobsUrl);
  }

  // Legacy dashboard route → jobs home
  if (session && pathname === '/customer/dashboard') {
    const jobsUrl = req.nextUrl.clone();
    jobsUrl.pathname = '/customer/jobs';
    return NextResponse.redirect(jobsUrl);
  }

  // Otherwise allow request
  const response = NextResponse.next();
  // Add pathname to headers so layout can check it
  response.headers.set('x-invoke-path', pathname);
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/cleaner/:path*',
    '/cleaners/:path*',
    '/verify/certificate/:path*',
    '/branch-owner/:path*',
    '/pilot/:path*',
    '/booking/:path*',
    '/customer/:path*',
    '/saas/:path*',
  ],
};
