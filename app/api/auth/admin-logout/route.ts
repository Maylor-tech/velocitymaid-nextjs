import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearLegacyAdminCookies } from '@/lib/auth/legacyAdminCookies';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Clear admin session cookie
    const cookieStore = await cookies();
    clearLegacyAdminCookies(cookieStore);
    cookieStore.delete('admin_session');

    return NextResponse.redirect(new URL('/admin/login', req.url));
  } catch (error: any) {
    console.error('[ADMIN LOGOUT] Error:', error);
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}

