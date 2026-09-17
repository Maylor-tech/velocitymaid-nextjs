export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { getWorkerRecord } from '@/lib/workers/getWorkerRecord';
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
 * Body: { patch?: AdminWorkerRecordPatch, agreement?: {...}, document?: {...} }
 * Agreement create is PENDING-only; document metadata has no notes / no TIN fields.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const body = await request.json().catch(() => ({}));
    const cleanerId = params.cleanerId;

    if (body.patch && typeof body.patch === 'object') {
      const result = await updateWorkerRecordAsAdmin({
        cleanerId,
        actorId: auth.userId,
        patch: body.patch,
      });
      if (result.ok === false) {
        return NextResponse.json({ success: false, error: result.error }, { status: result.status });
      }
    }

    if (body.agreement && typeof body.agreement === 'object') {
      if ('signedAt' in body.agreement && body.agreement.signedAt != null) {
        return NextResponse.json(
          { success: false, error: 'signedAt cannot be set on create' },
          { status: 400 }
        );
      }
      const result = await createWorkerAgreementAsAdmin({
        cleanerId,
        actorId: auth.userId,
        agreementType: String(body.agreement.agreementType || ''),
        agreementVersion: String(body.agreement.agreementVersion || ''),
        status: body.agreement.status,
        documentReference: body.agreement.documentReference ?? null,
        signedAt: body.agreement.signedAt,
      });
      if (result.ok === false) {
        return NextResponse.json({ success: false, error: result.error }, { status: result.status });
      }
    }

    if (body.document && typeof body.document === 'object') {
      if ('notes' in body.document && body.document.notes != null && body.document.notes !== '') {
        return NextResponse.json(
          { success: false, error: 'notes are not writable in this phase' },
          { status: 400 }
        );
      }
      const result = await upsertWorkerDocumentMetaAsAdmin({
        cleanerId,
        actorId: auth.userId,
        documentType: String(body.document.documentType || ''),
        status: String(body.document.status || ''),
        documentReference: body.document.documentReference ?? null,
        externalProviderReference: body.document.externalProviderReference ?? null,
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
