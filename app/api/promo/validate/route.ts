export const dynamic = 'force-dynamic';

/**
 * Validate Promo Code
 * GET /api/promo/validate?branch=new-jersey&promo=1-2024
 * 
 * Validates and returns promo information
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchSlug = searchParams.get('branch');
    const promoCode = searchParams.get('promo'); // Format: "month-year" e.g., "1-2024"

    if (!branchSlug || !promoCode) {
      return NextResponse.json(
        { success: false, error: 'Branch and promo code are required' },
        { status: 400 }
      );
    }

    // Parse promo code (format: "month-year")
    const [monthStr, yearStr] = promoCode.split('-');
    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid promo code format' },
        { status: 400 }
      );
    }

    // Get branch
    const branch = await prisma.branch.findUnique({
      where: { slug: branchSlug },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Get promo
    const promo = await prisma.promo.findUnique({
      where: {
        branchId_month_year: {
          branchId: branch.id,
          month,
          year,
        },
      },
    });

    if (!promo || !promo.active) {
      return NextResponse.json(
        { success: false, error: 'Promo not found or inactive' },
        { status: 404 }
      );
    }

    // Check if promo is still valid
    const now = new Date();
    if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) {
      return NextResponse.json(
        { success: false, error: 'Promo has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      promo: {
        id: promo.id,
        title: promo.title,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        startDate: promo.startDate,
        endDate: promo.endDate,
      },
    });
  } catch (error: any) {
    console.error('Validate promo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate promo' },
      { status: 500 }
    );
  }
}

