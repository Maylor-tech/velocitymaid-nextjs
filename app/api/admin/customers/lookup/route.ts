export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'email is required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        addressLine1: true,
        defaultAddress: true,
        city: true,
        state: true,
        travelZone: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ success: true, customer: null });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lookup failed';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
