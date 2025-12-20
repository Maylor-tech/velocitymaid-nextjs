/**
 * Get Single Application Details
 * GET /api/admin/recruitment/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication check

    const { id } = params;

    const application = await prisma.cleanerApplication.findUnique({
      where: { id },
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
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        name: application.name,
        email: application.email,
        phone: application.phone,
        whatsappNumber: application.whatsappNumber,
        experienceLevel: application.experienceLevel,
        areaOfResidence: application.areaOfResidence,
        daysAvailable: application.daysAvailable,
        weekendAbility: application.weekendAbility,
        canTravelToVillas: application.canTravelToVillas,
        idUploadUrl: application.idUploadUrl,
        referencesUploadUrl: application.referencesUploadUrl,
        applicantFitScore: application.applicantFitScore,
        status: application.status,
        notes: application.notes,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        branch: application.branch,
      },
    });
  } catch (error: any) {
    console.error('Get application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch application' },
      { status: 500 }
    );
  }
}


