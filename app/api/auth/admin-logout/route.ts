import { NextRequest, NextResponse } from 'next/server';
import { appendLegacyAdminCookieClears } from '@/lib/auth/legacyAdminCookies';

export const dynamic = 'force-dynamic';

function expireSignedSession(response: NextResponse) {
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  appendLegacyAdminCookieClears(response.headers);
}

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/login', req.url));
  try {
    expireSignedSession(response);
    return response;
  } catch (error: unknown) {
    console.error('[ADMIN LOGOUT] Error:', error);
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}
