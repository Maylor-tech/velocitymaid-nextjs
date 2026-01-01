/**
 * Admin Promo Management API
 * POST /api/admin/branches/[slug]/promo
 * 
 * Create or update monthly promo
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const body = await request.json();
    const {
      branchId,
      month,
      year,
      title,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      active,
    } = body;

    // Validations
    if (!branchId || !month || !year || !title || !description || !discountType || !discountValue || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (discountType !== 'percent' && discountType !== 'fixed') {
      return NextResponse.json(
        { success: false, error: 'discountType must be "percent" or "fixed"' },
        { status: 400 }
      );
    }

    if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Check if promo already exists
    const existingPromo = await prisma.promo.findUnique({
      where: {
        branchId_month_year: {
          branchId,
          month,
          year,
        },
      },
    });

    let promo;
    if (existingPromo) {
      // Update existing promo
      promo = await prisma.promo.update({
        where: { id: existingPromo.id },
        data: {
          title,
          description,
          discountType,
          discountValue,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          active: active ?? true,
        },
      });
    } else {
      // Create new promo
      promo = await prisma.promo.create({
        data: {
          branchId,
          month,
          year,
          title,
          description,
          discountType,
          discountValue,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          active: active ?? true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      promo,
    });
  } catch (error: any) {
    console.error('Save promo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save promo' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    // branchId is actually a slug in this context
    const slug = params.branchId;
    const branch = await prisma.branch.findUnique({
      where: { slug },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    const promos = await prisma.promo.findMany({
      where: { branchId: branch.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      promos,
    });
  } catch (error: any) {
    console.error('Get promos error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch promos' },
      { status: 500 }
    );
  }
}


