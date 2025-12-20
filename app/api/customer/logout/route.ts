export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/customerSession';

/**
 * POST /api/customer/logout
 * 
 * Logout customer and clear session
 */
export async function POST(request: NextRequest) {
  try {
    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear cookie with both paths to handle old and new cookies
    res.cookies.delete(COOKIE_NAME);
    res.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });
    // Also clear the old path cookie
    res.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/customer',
      maxAge: 0, // Expire immediately
    });

    return res;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to logout',
      },
      { status: 500 }
    );
  }
}
