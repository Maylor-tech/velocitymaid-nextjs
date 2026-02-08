export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { sendIssueFollowUpIfNeeded } from '@/lib/notifications/issueFollowUpWhatsApp';

// GET /api/admin/cleaners/[cleanerId]/compliance
export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;

    // Verify cleaner exists
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      select: {
        id: true,
        isSuspended: true,
        warningCount: true,
        email: true,
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Get compliance issues
    const issues = await prisma.complianceIssue.findMany({
      where: { cleanerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Check missing documents
    const application = await prisma.cleanerApplication.findFirst({
      where: {
        email: cleaner.email,
        status: 'APPROVED',
      },
      select: {
        idUploadUrl: true,
        referencesUploadUrl: true,
      },
    });

    // Check training status
    const trainingStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId },
      select: { overallStatus: true },
    });

    // Determine compliance status
    let complianceStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' = 'COMPLIANT';

    if (cleaner.isSuspended || cleaner.warningCount >= 3) {
      complianceStatus = 'NON_COMPLIANT';
    } else if (
      cleaner.warningCount > 0 ||
      issues.some((i) => i.severity >= 4) ||
      !application?.idUploadUrl ||
      !application?.referencesUploadUrl ||
      (trainingStatus && trainingStatus.overallStatus !== 'PASSED' && trainingStatus.overallStatus !== 'ACTIVE')
    ) {
      complianceStatus = 'AT_RISK';
    }

    return NextResponse.json({
      success: true,
      cleanerId,
      isSuspended: cleaner.isSuspended,
      warningCount: cleaner.warningCount,
      complianceStatus,
      issues: issues.map((issue) => ({
        id: issue.id,
        type: issue.type,
        severity: issue.severity,
        status: issue.status,
        summary: issue.reason,
        details: issue.notes,
        createdAt: issue.createdAt.toISOString(),
        resolvedAt: issue.resolvedAt?.toISOString() || null,
      })),
      missing: {
        idDocument: !application?.idUploadUrl,
        references: !application?.referencesUploadUrl,
        policeRecord: false, // TODO: Add police record check when field is available
        trainingPassed:
          trainingStatus?.overallStatus !== 'PASSED' &&
          trainingStatus?.overallStatus !== 'ACTIVE',
      },
    });
  } catch (error: any) {
    console.error('Get cleaner compliance error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get cleaner compliance' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/cleaners/[cleanerId]/compliance
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;
    const body = await request.json();
    const { isSuspended, warningCount, addIssue, resolveIssueId } = body;

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

    const changes: any = {};

    // Update suspension status
    if (isSuspended !== undefined) {
      const wasSuspended = cleaner.isSuspended;
      await prisma.user.update({
        where: { id: cleanerId },
        data: { isSuspended },
      });
      changes.isSuspended = { from: wasSuspended, to: isSuspended };

      // Log audit entry
      await logAuditEntry({
        actorId: null, // TODO: Get from session
        actorRole: 'ADMIN',
        action: isSuspended ? 'CLEANER_SUSPENDED' : 'CLEANER_UNSUSPENDED',
        entityType: 'Cleaner',
        entityId: cleanerId,
        description: isSuspended
          ? `Cleaner ${cleaner.name || cleanerId} was suspended`
          : `Cleaner ${cleaner.name || cleanerId} was unsuspended`,
        changes,
      });
    }

    // Update warning count
    if (warningCount !== undefined) {
      const oldWarningCount = cleaner.warningCount;
      await prisma.user.update({
        where: { id: cleanerId },
        data: { warningCount },
      });
      changes.warningCount = { from: oldWarningCount, to: warningCount };

      // Log audit entry
      await logAuditEntry({
        actorId: null, // TODO: Get from session
        actorRole: 'ADMIN',
        action: 'CLEANER_WARNING_UPDATED',
        entityType: 'Cleaner',
        entityId: cleanerId,
        description: `Warning count updated from ${oldWarningCount} to ${warningCount}`,
        changes,
      });
    }

    // Add compliance issue
    if (addIssue) {
      const issue = await prisma.complianceIssue.create({
        data: {
          cleanerId,
          jobId: addIssue.jobId ?? null,
          type: addIssue.type,
          severity: (addIssue.severity ?? 3) as import('@prisma/client').ComplianceSeverity,
          reason: addIssue.summary ?? addIssue.reason ?? 'Compliance issue',
          notes: addIssue.details ?? addIssue.notes ?? null,
          status: 'OPEN',
        },
      });

      await logAuditEntry({
        actorId: null,
        actorRole: 'ADMIN',
        action: 'COMPLIANCE_ISSUE_CREATED',
        entityType: 'ComplianceIssue',
        entityId: issue.id,
        description: `Compliance issue created for cleaner: ${addIssue.summary}`,
        changes: { issue },
      });

      sendIssueFollowUpIfNeeded(issue.id).catch(() => {});
    }

    // Resolve compliance issue
    if (resolveIssueId) {
      const issue = await prisma.complianceIssue.update({
        where: { id: resolveIssueId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });

      await logAuditEntry({
        actorId: null,
        actorRole: 'ADMIN',
        action: 'COMPLIANCE_ISSUE_RESOLVED',
        entityType: 'ComplianceIssue',
        entityId: resolveIssueId,
        description: `Compliance issue resolved: ${issue.reason}`,
        changes: { status: 'RESOLVED' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Compliance status updated',
    });
  } catch (error: any) {
    console.error('Update cleaner compliance error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update cleaner compliance' },
      { status: 500 }
    );
  }
}


















