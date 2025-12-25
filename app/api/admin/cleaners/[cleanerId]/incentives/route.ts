export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Incentive types
export type IncentiveType =
  | 'ON_TIME_STREAK'
  | 'HIGH_RATING_BONUS'
  | 'ELITE_LEVEL_BONUS'
  | 'COMPLAINT_FREE_BONUS'
  | 'HOLIDAY_BONUS';

export type IncentiveStatus = 'PENDING' | 'EARNED' | 'REVOKED';

export interface Incentive {
  id: string;
  cleanerId: string;
  type: IncentiveType;
  amount: number;
  currency: string;
  status: IncentiveStatus;
  description: string;
  earnedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/admin/cleaners/[cleanerId]/incentives
export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;

    // Verify cleaner exists
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // TODO: Replace with actual Incentive model when schema is updated
    // For now, return placeholder structure
    // In production, query: await prisma.incentive.findMany({ where: { cleanerId } })

    const incentives: Incentive[] = [];

    return NextResponse.json({
      success: true,
      incentives,
      totalEarned: 0,
      totalPending: 0,
    });
  } catch (error: any) {
    console.error('Get incentives error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get incentives' },
      { status: 500 }
    );
  }
}

// POST /api/admin/cleaners/[cleanerId]/incentives
export async function POST(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;
    const body = await request.json();
    const { type, amount, currency, description, status } = body;

    // Verify cleaner exists
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Validate
    const validTypes: IncentiveType[] = [
      'ON_TIME_STREAK',
      'HIGH_RATING_BONUS',
      'ELITE_LEVEL_BONUS',
      'COMPLAINT_FREE_BONUS',
      'HOLIDAY_BONUS',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid incentive type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Incentive model creation when schema is updated
    // const incentive = await prisma.incentive.create({
    //   data: {
    //     cleanerId,
    //     type,
    //     amount,
    //     currency: currency || 'USD',
    //     description: description || getDefaultDescription(type),
    //     status: status || 'PENDING',
    //   },
    // });

    // Placeholder response
    const incentive: Incentive = {
      id: `inc_${Date.now()}`,
      cleanerId,
      type,
      amount,
      currency: currency || 'USD',
      status: (status || 'PENDING') as IncentiveStatus,
      description: description || getDefaultDescription(type),
      earnedAt: status === 'EARNED' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      incentive,
    });
  } catch (error: any) {
    console.error('Create incentive error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create incentive' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/cleaners/[cleanerId]/incentives
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;
    const body = await request.json();
    const { incentiveId, status } = body;

    if (!incentiveId) {
      return NextResponse.json(
        { success: false, error: 'incentiveId is required' },
        { status: 400 }
      );
    }

    const validStatuses: IncentiveStatus[] = ['PENDING', 'EARNED', 'REVOKED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Incentive model update when schema is updated
    // const incentive = await prisma.incentive.update({
    //   where: { id: incentiveId, cleanerId },
    //   data: {
    //     status,
    //     earnedAt: status === 'EARNED' ? new Date() : null,
    //     updatedAt: new Date(),
    //   },
    // });

    // Placeholder response
    return NextResponse.json({
      success: true,
      message: 'Incentive status updated',
    });
  } catch (error: any) {
    console.error('Update incentive error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update incentive' },
      { status: 500 }
    );
  }
}

function getDefaultDescription(type: IncentiveType): string {
  const descriptions: Record<IncentiveType, string> = {
    ON_TIME_STREAK: 'On-time streak bonus',
    HIGH_RATING_BONUS: 'High rating bonus',
    ELITE_LEVEL_BONUS: 'Elite level performance bonus',
    COMPLAINT_FREE_BONUS: 'Complaint-free period bonus',
    HOLIDAY_BONUS: 'Holiday bonus',
  };
  return descriptions[type] || 'Incentive bonus';
}

















