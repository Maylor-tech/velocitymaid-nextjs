export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { storeMagicToken, countActiveTokensForCustomer } from '@/lib/magicTokenStore';

// Rate limiting constants
const MAX_TOKENS_PER_CUSTOMER = 5; // Max 5 active tokens per customer
const MAX_REQUESTS_PER_HOUR = 10; // Max 10 requests per IP per hour

// Simple in-memory rate limiter (replace with Redis in production)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 hour
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/auth/customer-magic-link
 * 
 * Body: { email: string }
 * 
 * Sends a magic login link to the customer's email
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, firstName: true },
    });

    if (!customer) {
      // Don't reveal if email exists - security best practice
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a login link has been sent.',
      });
    }

    // Check rate limit per customer
    const activeTokenCount = await countActiveTokensForCustomer(customer.id);
    if (activeTokenCount >= MAX_TOKENS_PER_CUSTOMER) {
      return NextResponse.json(
        { success: false, error: 'Too many active login links. Please check your email or wait a few minutes.' },
        { status: 429 }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store token in database
    await storeMagicToken(token, {
      customerId: customer.id,
      email: customer.email,
      expiresAt,
    });

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/auth/customer/callback?token=${token}`;

    // Send email (production)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'VelocityMaid <noreply@velocitymaid.com>',
          to: customer.email,
          subject: 'Your secure login link - VelocityMaid',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome back, ${customer.firstName}!</h2>
              <p>Click the button below to securely access your VelocityMaid dashboard:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Access My Dashboard
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                This link expires in 15 minutes and can only be used once.
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                If you didn't request this link, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px;">
                Or copy and paste this link into your browser:<br>
                <a href="${magicLink}" style="color: #2563eb; word-break: break-all;">${magicLink}</a>
              </p>
            </div>
          `,
          text: `Welcome back, ${customer.firstName}!\n\nAccess your dashboard: ${magicLink}\n\nThis link expires in 15 minutes.`,
        });

        console.log(`[MAGIC LINK] Email sent to ${customer.email}`);
      } catch (emailError: any) {
        console.error('[MAGIC LINK] Email send error:', emailError);
        // Don't fail the request if email fails - log it
      }
    } else {
      // Development mode - log link
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MAGIC LINK] For ${customer.email}: ${magicLink}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a login link has been sent.',
      // Only show link in development
      ...(process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY && { magicLink }),
    });
  } catch (error: any) {
    console.error('[MAGIC LINK] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send magic link' },
      { status: 500 }
    );
  }
}

