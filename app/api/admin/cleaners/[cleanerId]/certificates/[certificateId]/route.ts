import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/cleaners/[cleanerId]/certificates/[certificateId]
 * 
 * Revoke or restore a training certificate
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { cleanerId: string; certificateId: string } }
) {
  try {
    const { cleanerId, certificateId } = params;
    const body = await req.json();
    const { action, reason } = body;

    if (!['revoke', 'restore'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "revoke" or "restore".' },
        { status: 400 }
      );
    }

    const cert = await prisma.trainingCertificate.findUnique({
      where: { id: certificateId },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        trainingStatus: {
          select: {
            id: true,
            overallStatus: true,
          },
        },
      },
    });

    if (!cert || cert.cleanerId !== cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found for this cleaner' },
        { status: 404 }
      );
    }

    const now = new Date();

    const updated = await prisma.trainingCertificate.update({
      where: { id: certificateId },
      data: {
        status: action === 'revoke' ? 'REVOKED' : 'ACTIVE',
        revokedAt: action === 'revoke' ? now : null,
      },
    });

    // Audit log
    const description =
      action === 'revoke'
        ? `Training certificate ${cert.certificateId} revoked for cleaner ${cleanerId}`
        : `Training certificate ${cert.certificateId} restored for cleaner ${cleanerId}`;

    await logAuditEntry({
      actorId: null, // TODO: attach real admin user once auth is added
      actorRole: 'ADMIN',
      action: action === 'revoke' ? 'TRAINING_CERT_REVOKED' : 'TRAINING_CERT_RESTORED',
      entityType: 'TrainingCertificate',
      entityId: certificateId,
      description,
      changes: {
        status: updated.status,
        revokedAt: updated.revokedAt,
        reason: reason || null,
      },
    });

    return NextResponse.json({ success: true, certificate: updated });
  } catch (error: any) {
    console.error('Error updating training certificate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update certificate status' },
      { status: 500 }
    );
  }
}
















