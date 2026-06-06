export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {  try {
    const models = await prisma.pricingModel.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      models,
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('List pricing models error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pricing models' },
      { status: 500 }
    );
  }
}

