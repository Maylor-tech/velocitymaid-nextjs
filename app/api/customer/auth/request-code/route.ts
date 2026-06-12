import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { sendCustomerLoginCodeEmail } from '@/lib/email/sendCustomerLoginCode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function generate6DigitCode(): string {
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.customerLoginToken.create({
      data: {
        id: nanoid(),
        customerId: customer.id,
        code,
        expiresAt,
      },
    });

    const isDev = process.env.NODE_ENV !== 'production';
    let emailSent = false;

    if (process.env.RESEND_API_KEY) {
      const result = await sendCustomerLoginCodeEmail({
        email: normalizedEmail,
        code,
        expiresMinutes: 10,
      });
      emailSent = result.sent;
      if (!result.sent) {
        console.error('[request-code] Resend failed:', result.error);
        if (!isDev) {
          return NextResponse.json(
            {
              error:
                'We could not send your login code. Please try again in a few minutes.',
            },
            { status: 503 }
          );
        }
      }
    } else if (!isDev) {
      return NextResponse.json(
        {
          error:
            'Email service is not configured. Please contact support.',
        },
        { status: 503 }
      );
    }

    if (isDev) {
      console.log('\n🔐 LOGIN CODE FOR', normalizedEmail);
      console.log('═══════════════════════════════════════');
      console.log('   CODE:', code);
      console.log('   Email sent:', emailSent);
      console.log('═══════════════════════════════════════\n');
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      emailSent,
      ...(isDev && !emailSent ? { code } : {}),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error in request-code:', error);
    const errorMessage =
      process.env.NODE_ENV === 'production'
        ? 'Failed to request login code'
        : error instanceof Error
          ? error.message
          : 'Failed to request login code';

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV !== 'production' && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}
