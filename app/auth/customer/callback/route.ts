import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createCustomerSessionToken, COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from '../../../../lib/customerSession';
import { prisma } from '../../../../lib/prisma';
import { consumeMagicToken } from '../../../../lib/magicTokenStore';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/customer/login?error=invalid_token', req.url));
    }

    // Verify and consume token (atomic operation)
    const tokenData = await consumeMagicToken(token);

    if (!tokenData) {
      return NextResponse.redirect(new URL('/customer/login?error=invalid_token', req.url));
    }

    // Verify customer still exists
    const customer = await prisma.customer.findUnique({
      where: { id: tokenData.customerId },
      select: { id: true, email: true },
    });

    if (!customer) {
      return NextResponse.redirect(new URL('/customer/login?error=customer_not_found', req.url));
    }

    // Create session token
    const sessionToken = await createCustomerSessionToken({
      customerId: customer.id,
      email: customer.email,
      issuedAt: Date.now(),
    });

    // Set secure cookie (FINAL SECURITY PASS)
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_SECONDS, // 30 days
      path: '/',
    });

    // Redirect to dashboard
    const redirectUrl = searchParams.get('redirect') || '/customer/jobs';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error: any) {
    console.error('[AUTH CALLBACK] Error:', error);
    return NextResponse.redirect(new URL('/customer/login?error=server_error', req.url));
  }
}

