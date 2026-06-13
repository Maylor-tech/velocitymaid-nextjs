export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { getCertificationSummary } from '@/lib/cleaners/trainingProgress';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';

// PATCH /api/admin/cleaners/[cleanerId]/training
// Update training status for a cleaner
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {  try {
    const { cleanerId } = params;
    const body = await request.json();
    const { overallStatus } = body;

    // Validate status
    const validStatuses = ['PENDING', 'IN_REVIEW', 'PASSED', 'ACTIVE', 'NOT_STARTED'];
    if (!validStatuses.includes(overallStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

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

    // Get old status for audit log
    const oldStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId },
      select: { overallStatus: true },
    });

    // Update or create training status
    const trainingStatus = await prisma.trainingStatus.upsert({
      where: { cleanerId },
      update: {
        overallStatus,
        updatedAt: new Date(),
      },
      create: {
        cleanerId,
        overallStatus,
        updatedAt: new Date(),
      },
    });

    // Phase 5 Step 5: Log audit entry
    await logAuditEntry({
      actorId: null, // TODO: Get from session
      actorRole: 'ADMIN',
      action: 'TRAINING_STATUS_UPDATED',
      entityType: 'Cleaner',
      entityId: cleanerId,
      description: `Training status updated from ${oldStatus?.overallStatus || 'NONE'} to ${overallStatus}`,
      changes: {
        overallStatus: {
          from: oldStatus?.overallStatus || null,
          to: overallStatus,
        },
      },
    });

    return NextResponse.json({
      success: true,
      trainingStatus: {
        id: trainingStatus.id,
        cleanerId: trainingStatus.cleanerId,
        overallStatus: trainingStatus.overallStatus,
        lastModuleSlug: trainingStatus.lastModuleSlug,
        updatedAt: trainingStatus.updatedAt,
      },
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Update training status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update training status' },
      { status: 500 }
    );
  }
}

// GET /api/admin/cleaners/[cleanerId]/training
// Get training status for a cleaner
export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    await requireRole(request, "ADMIN");
    const { cleanerId } = params;

    const trainingStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId },
    });

    const certification = await getCertificationSummary(cleanerId);

    return NextResponse.json({
      success: true,
      trainingStatus: trainingStatus
        ? {
            id: trainingStatus.id,
            cleanerId: trainingStatus.cleanerId,
            overallStatus: trainingStatus.overallStatus,
            lastModuleSlug: trainingStatus.lastModuleSlug,
            updatedAt: trainingStatus.updatedAt,
          }
        : null,
      certification: {
        status: certification.status,
        modulesCompleted: certification.modulesCompleted,
        modulesTotal: certification.modulesTotal,
        quizScore: certification.quizScore,
        certifiedAt: certification.certifiedAt,
        modules: certification.modules.map((m) => ({
          slug: m.slug,
          title: m.title,
          completed: m.completed,
          completedAt: m.completedAt,
          quizScore: m.quizScore,
        })),
      },
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Get training status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get training status' },
      { status: 500 }
    );
  }
}

