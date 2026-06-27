import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  createCustomerSessionToken,
} from '@/lib/customerSession';
import {
  isCustomerPortalEmailBlocked,
  customerPortalBlockedMessage,
} from '@/lib/customer/portalAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const codeStr = String(code).trim();

    if (!/^\d{6}$/.test(codeStr)) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found for this email' },
        { status: 404 },
      );
    }

    if (
      customer.isBlocked ||
      isCustomerPortalEmailBlocked(normalizedEmail)
    ) {
      return NextResponse.json(
        { error: customerPortalBlockedMessage(), cleanerPortalUrl: '/cleaners/login' },
        { status: 403 },
      );
    }

    const now = new Date();

    const tokenRecord = await prisma.customerLoginToken.findFirst({
      where: {
        customerId: customer.id,
        code: codeStr,
        used: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 },
      );
    }

    // Mark this token as used
    await prisma.customerLoginToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    // Create session token
    const payload = {
      customerId: customer.id,
      email: normalizedEmail,
      issuedAt: Math.floor(Date.now() / 1000),
    };

    const sessionToken = await createCustomerSessionToken(payload);

    const res = NextResponse.json({
      success: true,
      redirectTo: '/customer',
    });

    res.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });

    return res;
  } catch (error) {
    console.error('Error in verify-code:', error);
    return NextResponse.json(
      { error: 'Failed to verify login code' },
      { status: 500 },
    );
  }
}
