export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { getWorkerRecord } from '@/lib/workers/getWorkerRecord';
import { updateWorkerRecordAsCleaner } from '@/lib/workers/updateWorkerRecord';

const FORBIDDEN_SELF_SERVICE_KEYS = [
  'classificationStatus',
  'legalFirstName',
  'legalLastName',
  'startDate',
  'inactiveDate',
  'memberStatus',
  'isActive',
  'agreement',
  'document',
  'agreements',
  'documents',
  'cleanerId',
  'userId',
] as const;

const ALLOWED_SELF_SERVICE_KEYS = new Set([
  'publicDisplayName',
  'mailingAddressLine1',
  'mailingAddressLine2',
  'mailingCity',
  'mailingState',
  'mailingPostalCode',
  'mailingCountry',
  'paymentPreference',
]);

/**
 * GET /api/cleaner/worker-record
 * Own worker record only — cleanerId always from session, never from client input.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    // Intentionally ignore any cleanerId query/body — session only
    const record = await getWorkerRecord(auth.userId);
    if (!record) {
      return NextResponse.json({ success: false, error: 'Worker record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      record: {
        cleanerId: record.cleanerId,
        email: record.email,
        phone: record.phone,
        displayName: record.displayName,
        identity: {
          preferredDisplayName: record.identity.preferredDisplayName,
          firstName: record.identity.firstName,
          lastName: record.identity.lastName,
          mailingAddressLine1: record.identity.mailingAddressLine1,
          mailingAddressLine2: record.identity.mailingAddressLine2,
          mailingCity: record.identity.mailingCity,
          mailingState: record.identity.mailingState,
          mailingPostalCode: record.identity.mailingPostalCode,
          mailingCountry: record.identity.mailingCountry,
          // legal name not self-editable; omit full legal fields from cleaner surface
        },
        workStatus: {
          classificationStatus: record.workStatus.classificationStatus,
          memberStatus: record.workStatus.memberStatus,
          isActive: record.workStatus.isActive,
          startDate: record.workStatus.startDate,
          inactiveDate: record.workStatus.inactiveDate,
          primaryBranch: record.workStatus.primaryBranch,
        },
        documentation: {
          w9MetaStatus: record.documentation.w9MetaStatus,
          agreements: record.documentation.agreements.map((a) => ({
            agreementType: a.agreementType,
            agreementVersion: a.agreementVersion,
            status: a.status,
            signedAt: a.signedAt,
          })),
        },
        paymentPreference: record.paymentPreference,
        compensationSummary: record.compensationSummary,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('[CLEANER_WORKER_RECORD_GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load worker record' }, { status: 500 });
  }
}

/**
 * PATCH /api/cleaner/worker-record
 * Self-service allowlist only. Session cleanerId only (no IDOR via body cleanerId).
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    const body = await request.json().catch(() => ({}));
    const raw = body.patch && typeof body.patch === 'object' ? body.patch : body;

    for (const key of FORBIDDEN_SELF_SERVICE_KEYS) {
      if (key in body || (raw && typeof raw === 'object' && key in raw)) {
        return NextResponse.json(
          { success: false, error: `Field not self-service: ${key}` },
          { status: 403 }
        );
      }
    }

    if (raw && typeof raw === 'object') {
      for (const key of Object.keys(raw)) {
        if (key === 'patch') continue;
        if (!ALLOWED_SELF_SERVICE_KEYS.has(key)) {
          return NextResponse.json(
            { success: false, error: `Field not self-service: ${key}` },
            { status: 403 }
          );
        }
      }
    }

    const result = await updateWorkerRecordAsCleaner({
      cleanerId: auth.userId,
      patch: {
        publicDisplayName: raw.publicDisplayName,
        mailingAddressLine1: raw.mailingAddressLine1,
        mailingAddressLine2: raw.mailingAddressLine2,
        mailingCity: raw.mailingCity,
        mailingState: raw.mailingState,
        mailingPostalCode: raw.mailingPostalCode,
        mailingCountry: raw.mailingCountry,
        paymentPreference: raw.paymentPreference,
      },
    });

    if (result.ok === false) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    const record = await getWorkerRecord(auth.userId);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('[CLEANER_WORKER_RECORD_PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update worker record' }, { status: 500 });
  }
}
