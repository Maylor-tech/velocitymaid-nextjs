export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      city,
      state,
      country,
      desiredBranchSlug,
      background,
      investmentCapacityRange,
      notes,
    } = body;

    // Basic validation
    if (!name || !email || !phone || !city || !state || !country || !investmentCapacityRange) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.franchiseApplication.create({
      data: {
        name,
        email,
        phone,
        city,
        state,
        country,
        desiredBranchSlug: desiredBranchSlug || null,
        background: background || null,
        investmentCapacityRange,
        notes: notes || null,
        status: 'PENDING',
      },
    });

    // TODO: Send admin notification (email, WhatsApp, etc.)

    return NextResponse.json({
      success: true,
      application,
      message: 'Franchise application submitted successfully',
    });
  } catch (error: any) {
    console.error('Franchise application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit franchise application' },
      { status: 500 }
    );
  }
}
