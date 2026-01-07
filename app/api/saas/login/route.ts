import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { validateEmail } from '@/lib/validation/saas';
import { verifyPassword } from '@/lib/auth/password';

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
  console.log('\n[LOGIN] Received new login request.');
  console.log(`[LOGIN] Request ID: ${requestId}`);
  
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('[LOGIN] Request body parsed:', { 
        email: body.email, 
        hasPassword: !!body.password,
      });
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', requestId },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required', requestId },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required', requestId },
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
    console.log(`[LOGIN] Attempting login for email: ${normalizedEmail}`);

    // Find user by email
    console.log('[LOGIN] Searching for user in database...');
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
        isActive: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      console.error('[LOGIN] Error: User not found.');
      console.log(`[${requestId}] Login attempt with non-existent email: ${normalizedEmail}`);
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json(
        { success: false, error: 'Invalid email or password', requestId },
        { status: 401 }
      );
    }

    console.log('[LOGIN] User found in database:', {
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
      hasPassword: !!user.password,
      isActive: user.isActive,
    });

    // Check if user has a password (required for SaaS login)
    if (!user.password) {
      console.error('[LOGIN] Error: User not found or password not set.');
      console.log(`[${requestId}] Login attempt by user without password: ${user.id}`);
      return NextResponse.json(
        { success: false, error: 'User account is not properly configured. Please reset your password.', requestId },
        { status: 403 }
      );
    }

    // Verify password
    console.log('[LOGIN] Comparing password with stored hash...');
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      console.error('[LOGIN] Error: Password comparison failed.');
      console.log(`[${requestId}] Invalid password attempt for: ${normalizedEmail}`);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password', requestId },
        { status: 401 }
      );
    }
    console.log('[LOGIN] Password is valid.');

    // Check if user has a tenant (required for SaaS access)
    if (!user.tenantId) {
      console.log(`[${requestId}] Login attempt by user without tenant: ${user.id}`);
      return NextResponse.json(
        { success: false, error: 'User account is not properly configured', requestId },
        { status: 403 }
      );
    }

    // Create JWT token
    console.log('[LOGIN] Creating JWT and setting cookie...');
    const { createToken } = await import('@/lib/auth/jwt');
    let token: string;
    try {
      token = await createToken({
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId!,
        role: user.role,
      });
      console.log('[LOGIN] JWT token created successfully.');
    } catch (tokenError: any) {
      console.error('\n[LOGIN] FATAL ERROR: Token creation failed');
      console.error(`[${requestId}] Token creation error:`, tokenError);
      console.error(`[${requestId}] Token error details:`, {
        message: tokenError.message,
        stack: tokenError.stack,
      });
      
      // Provide more helpful error message
      let errorMessage = 'Failed to create session';
      if (tokenError.message?.includes('JWT_SECRET')) {
        errorMessage = 'Server configuration error. Please contact support.';
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage, requestId },
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
      console.log('[LOGIN] Cookie set successfully.');
    } catch (cookieError: any) {
      console.error(`[${requestId}] Cookie setting error:`, cookieError);
      return NextResponse.json(
        { success: false, error: 'Failed to set session', requestId },
        { status: 500 }
      );
    }

    console.log(`[LOGIN] Login successful for: ${normalizedEmail}`);
    console.log('[LOGIN] User authenticated and session created.');

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
    console.error('\n[LOGIN] FATAL ERROR: Unexpected error in login');
    console.error(`[${requestId}] Login error:`, error);
    console.error(`[${requestId}] Error details:`, {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred', requestId },
      { status: 500 }
    );
  }
}

