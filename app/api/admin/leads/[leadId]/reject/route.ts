/**
 * Reject Lead
 * POST /api/admin/leads/[leadId]/reject
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Update lead status
    await prisma.lead.update({
      where: { id: params.leadId },
      data: {
        status: 'REJECTED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lead rejected',
    });
  } catch (error: any) {
    console.error('Reject lead error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject lead' },
      { status: 500 }
    );
  }
}


