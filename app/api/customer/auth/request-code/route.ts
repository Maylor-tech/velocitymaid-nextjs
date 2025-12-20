import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

function generate6DigitCode(): string {
  // Always 6 digits, zero-padded
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find or create customer by email
    let customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          id: nanoid(),
          email: normalizedEmail,
          firstName: 'Customer',
          lastName: '',
          updatedAt: new Date(),
        },
      });
    }

    // Invalidate previous unused codes for this customer
    await prisma.customerLoginToken.updateMany({
      where: {
        customerId: customer.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        used: true,
      },
    });

    const code = generate6DigitCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.customerLoginToken.create({
      data: {
        customerId: customer.id,
        code,
        expiresAt,
      },
    });

    // TODO: In production, send code via email/SendGrid, etc.
    // For development, return code in response for easy testing.
    const isDev = process.env.NODE_ENV !== 'production';

    // Log code to console for easy access in development
    if (isDev) {
      console.log('\n🔐 LOGIN CODE FOR', normalizedEmail);
      console.log('═══════════════════════════════════════');
      console.log('   CODE:', code);
      console.log('═══════════════════════════════════════\n');
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      ...(isDev ? { code } : {}),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error in request-code:', error);
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to request login code' 
      : error?.message || 'Failed to request login code';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
      },
      { status: 500 },
    );
  }
}
