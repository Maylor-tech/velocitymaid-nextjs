export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

/**
 * Admin Recruitment Dashboard API
 * GET /api/admin/recruitment
 * 
 * Returns list of cleaner applications with fit scores
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');

    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (minScore) {
      where.applicantFitScore = {
        gte: parseInt(minScore),
      };
    }

    const applications = await prisma.cleanerApplication.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
          },
        },
      },
      orderBy: [
        { applicantFitScore: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      applications: applications.map((app) => ({
        id: app.id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        whatsappNumber: app.whatsappNumber,
        experienceLevel: app.experienceLevel,
        areaOfResidence: app.areaOfResidence,
        weekendAbility: app.weekendAbility,
        canTravelToVillas: app.canTravelToVillas,
        applicantFitScore: app.applicantFitScore,
        status: app.status,
        createdAt: app.createdAt,
        branch: app.branch,
      })),
      count: applications.length,
    });
  } catch (error: any) {
    console.error('Get recruitment applications error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

