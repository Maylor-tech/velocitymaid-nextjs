export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';

// GET /api/admin/customers/[customerId]/risk
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        riskScore: true,
        riskFlags: true,
        isBlocked: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get complaints count (placeholder - Complaint model needs to be added)
    // TODO: Replace with actual Complaint model queries when schema is updated
    const complaintsCount = 0; // Placeholder
    const lastComplaintAt = null; // Placeholder

    // Get unpaid jobs count (jobs with status completed but no payment)
    const unpaidJobsCount = await prisma.job.count({
      where: {
        customerId,
        status: 'completed',
        // TODO: Add payment status check when payment tracking is available
      },
    });

    return NextResponse.json({
      success: true,
      customerId,
      riskScore: customer.riskScore,
      riskFlags: customer.riskFlags,
      isBlocked: customer.isBlocked,
      complaintsCount,
      lastComplaintAt,
      unpaidJobsCount,
    });
  } catch (error: any) {
    console.error('Get customer risk error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get customer risk' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/customers/[customerId]/risk
export async function PATCH(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;
    const body = await request.json();
    const { riskScore, riskFlags, isBlocked } = body;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const changes: any = {};

    // Update risk score
    if (riskScore !== undefined) {
      changes.riskScore = { from: customer.riskScore, to: riskScore };
    }

    // Update risk flags
    if (riskFlags !== undefined) {
      changes.riskFlags = { from: customer.riskFlags, to: riskFlags };
    }

    // Update blocked status
    if (isBlocked !== undefined) {
      changes.isBlocked = { from: customer.isBlocked, to: isBlocked };
    }

    // Auto-block if risk score >= 80
    const finalRiskScore = riskScore !== undefined ? riskScore : customer.riskScore;
    const shouldBlock = finalRiskScore >= 80;

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(riskScore !== undefined && { riskScore }),
        ...(riskFlags !== undefined && { riskFlags }),
        ...(isBlocked !== undefined ? { isBlocked } : shouldBlock ? { isBlocked: true } : {}),
      },
    });

    // Log audit entry
    await logAuditEntry({
      actorId: null, // TODO: Get from session
      actorRole: 'ADMIN',
      action: isBlocked ? 'CUSTOMER_BLOCKED' : 'CUSTOMER_RISK_UPDATED',
      entityType: 'Customer',
      entityId: customerId,
      description: `Customer risk profile updated: ${JSON.stringify(changes)}`,
      changes,
    });

    return NextResponse.json({
      success: true,
      message: 'Customer risk updated',
    });
  } catch (error: any) {
    console.error('Update customer risk error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update customer risk' },
      { status: 500 }
    );
  }
}


















