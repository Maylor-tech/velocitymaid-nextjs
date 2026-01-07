import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { validateEmail } from '@/lib/validation/saas';

export const runtime = 'nodejs';

/**
 * Login for SaaS tenant users
 * 
 * POST /api/saas/login
 * 
 * Body:
 * {
 *   "email": "user@company.com"
 * }
 */
export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', requestId },
        { status: 400 }
      );
    }

    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required', requestId },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error, requestId },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
        isActive: true,
      },
    });

    if (!user) {
      console.log(`[${requestId}] Login attempt with non-existent email: ${normalizedEmail}`);
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json(
        { success: false, error: 'Invalid email or password', requestId },
        { status: 401 }
      );
    }

    // Check if user has a tenant (required for SaaS access)
    if (!user.tenantId) {
      console.log(`[${requestId}] Login attempt by user without tenant: ${user.id}`);
      return NextResponse.json(
        { success: false, error: 'User account is not properly configured', requestId },
        { status: 403 }
      );
    }

    // Create JWT token
    const { createToken } = await import('@/lib/auth/jwt');
    let token: string;
    try {
      token = await createToken({
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId!,
        role: user.role,
      });
    } catch (tokenError: any) {
      console.error(`[${requestId}] Token creation error:`, tokenError);
      return NextResponse.json(
        { success: false, error: 'Failed to create session', requestId },
        { status: 500 }
      );
    }

    // Set JWT token in HttpOnly cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set('saas_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (cookieError: any) {
      console.error(`[${requestId}] Cookie setting error:`, cookieError);
      return NextResponse.json(
        { success: false, error: 'Failed to set session', requestId },
        { status: 500 }
      );
    }

    console.log(`[${requestId}] Login successful for: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
      },
      requestId,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Login error:`, error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred', requestId },
      { status: 500 }
    );
  }
}

