export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { getWorkerRecord } from '@/lib/workers/getWorkerRecord';
import { countAdminWorkerRecordOperations } from '@/lib/workers/adminWorkerRecordOps';
import {
  createWorkerAgreementAsAdmin,
  updateWorkerRecordAsAdmin,
  upsertWorkerDocumentMetaAsAdmin,
} from '@/lib/workers/updateWorkerRecord';

/**
 * GET /api/admin/cleaners/[cleanerId]/worker-record
 * Admin Worker Record (identity, classification, docs, payment pref, compensation summary).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const record = await getWorkerRecord(params.cleanerId);
    if (!record) {
      return NextResponse.json({ success: false, error: 'Cleaner not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, record });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('[ADMIN_WORKER_RECORD_GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load worker record' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/cleaners/[cleanerId]/worker-record
 * Body must contain exactly one of: patch | agreement | document.
 * Agreement create is PENDING-only; document metadata has no notes / no TIN fields.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const cleanerId = params.cleanerId;

    const ops = countAdminWorkerRecordOperations(body);
    if (ops.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Provide exactly one of patch, agreement, or document per request (no combined mutations)',
        },
        { status: 400 }
      );
    }

    if (ops.hasPatch) {
      const result = await updateWorkerRecordAsAdmin({
        cleanerId,
        actorId: auth.userId,
        patch: body.patch as Record<string, unknown>,
      });
      if (result.ok === false) {
        return NextResponse.json({ success: false, error: result.error }, { status: result.status });
      }
    } else if (ops.hasAgreement) {
      const agreement = body.agreement as Record<string, unknown>;
      if ('signedAt' in agreement && agreement.signedAt != null) {
        return NextResponse.json(
          { success: false, error: 'signedAt cannot be set on create' },
          { status: 400 }
        );
      }
      const result = await createWorkerAgreementAsAdmin({
        cleanerId,
        actorId: auth.userId,
        agreementType: String(agreement.agreementType || ''),
        agreementVersion: String(agreement.agreementVersion || ''),
        status: agreement.status as string | undefined,
        documentReference: (agreement.documentReference as string | null) ?? null,
        signedAt: agreement.signedAt,
      });
      if (result.ok === false) {
        return NextResponse.json({ success: false, error: result.error }, { status: result.status });
      }
    } else if (ops.hasDocument) {
      const document = body.document as Record<string, unknown>;
      if ('notes' in document && document.notes != null && document.notes !== '') {
        return NextResponse.json(
          { success: false, error: 'notes are not writable in this phase' },
          { status: 400 }
        );
      }
      const result = await upsertWorkerDocumentMetaAsAdmin({
        cleanerId,
        actorId: auth.userId,
        documentType: String(document.documentType || ''),
        status: String(document.status || ''),
        documentReference: (document.documentReference as string | null) ?? null,
        externalProviderReference:
          (document.externalProviderReference as string | null) ?? null,
      });
      if (result.ok === false) {
        return NextResponse.json({ success: false, error: result.error }, { status: result.status });
      }
    }

    const record = await getWorkerRecord(cleanerId);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('[ADMIN_WORKER_RECORD_PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update worker record' }, { status: 500 });
  }
}
