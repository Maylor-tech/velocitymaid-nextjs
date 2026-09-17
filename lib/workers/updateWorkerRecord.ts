import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import type { Prisma } from '@prisma/client';
import { ensureCleanerProfile } from '@/lib/workers/ensureCleanerProfile';
import {
  assertDeliberateClassificationChange,
  isClassificationStatus,
  normalizeClassificationStatus,
  type ClassificationStatus,
} from '@/lib/workers/classification';
import {
  isPaymentPreference,
  normalizePaymentPreference,
  type PaymentPreference,
} from '@/lib/workers/paymentPreference';
import { isAgreementStatus } from '@/lib/workers/agreements';
import { isDocumentStatus, isDocumentType } from '@/lib/workers/documents';

export type AdminWorkerRecordPatch = {
  legalFirstName?: string | null;
  legalLastName?: string | null;
  publicDisplayName?: string | null;
  mailingAddressLine1?: string | null;
  mailingAddressLine2?: string | null;
  mailingCity?: string | null;
  mailingState?: string | null;
  mailingPostalCode?: string | null;
  mailingCountry?: string | null;
  startDate?: string | null;
  inactiveDate?: string | null;
  classificationStatus?: ClassificationStatus;
  paymentPreference?: PaymentPreference | null;
  memberStatus?: string;
};

/** Fields a cleaner may self-update. Never classification / legal / agreements. */
export type CleanerSelfServicePatch = {
  publicDisplayName?: string | null;
  mailingAddressLine1?: string | null;
  mailingAddressLine2?: string | null;
  mailingCity?: string | null;
  mailingState?: string | null;
  mailingPostalCode?: string | null;
  mailingCountry?: string | null;
  paymentPreference?: PaymentPreference | null;
};

const ADMIN_PATCH_KEYS = new Set([
  'legalFirstName',
  'legalLastName',
  'publicDisplayName',
  'mailingAddressLine1',
  'mailingAddressLine2',
  'mailingCity',
  'mailingState',
  'mailingPostalCode',
  'mailingCountry',
  'startDate',
  'inactiveDate',
  'classificationStatus',
  'paymentPreference',
  'memberStatus',
]);

/** Values safe to log in AuditLog (enums / status). Never log addresses or credentials. */
const AUDIT_VALUE_SAFE_FIELDS = new Set([
  'classificationStatus',
  'paymentPreference',
  'memberStatus',
  'startDate',
  'inactiveDate',
]);

const MAX_REF_LEN = 200;

function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  return d;
}

function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

function boundOpaqueRef(
  value: string | null | undefined
): { ok: true; value: string | null | undefined } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) return { ok: true, value: null };
  const t = value.trim();
  if (t === '') return { ok: true, value: null };
  if (t.length > MAX_REF_LEN) {
    return { ok: false, error: `Reference exceeds ${MAX_REF_LEN} characters` };
  }
  return { ok: true, value: t };
}

function pickAdminPatch(raw: Record<string, unknown>): AdminWorkerRecordPatch {
  const patch: AdminWorkerRecordPatch = {};
  for (const key of ADMIN_PATCH_KEYS) {
    if (key in raw) {
      (patch as Record<string, unknown>)[key] = raw[key];
    }
  }
  return patch;
}

function buildPrivacySafeAuditChanges(
  cleanerId: string,
  before: Record<string, unknown>,
  updated: Record<string, unknown>,
  cleanedKeys: string[]
): { cleanerId: string; changedFields: string[]; values?: Record<string, { from: unknown; to: unknown }> } {
  const changedFields: string[] = [];
  const values: Record<string, { from: unknown; to: unknown }> = {};

  for (const key of cleanedKeys) {
    const fromVal = before[key];
    const toVal = updated[key];
    if (String(fromVal ?? '') === String(toVal ?? '')) continue;
    changedFields.push(key);
    if (AUDIT_VALUE_SAFE_FIELDS.has(key)) {
      values[key] = {
        from: fromVal instanceof Date ? fromVal.toISOString() : fromVal,
        to: toVal instanceof Date ? toVal.toISOString() : toVal,
      };
    }
  }

  return Object.keys(values).length > 0
    ? { cleanerId, changedFields, values }
    : { cleanerId, changedFields };
}

export async function updateWorkerRecordAsAdmin(params: {
  cleanerId: string;
  actorId: string | null;
  patch: AdminWorkerRecordPatch | Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { cleanerId, actorId } = params;
  const patch = pickAdminPatch(params.patch as Record<string, unknown>);

  const user = await prisma.user.findUnique({
    where: { id: cleanerId, role: 'CLEANER' },
    select: { id: true },
  });
  if (!user) return { ok: false, error: 'Cleaner not found', status: 404 };

  const profile = await ensureCleanerProfile(cleanerId);
  const before = { ...profile } as Record<string, unknown>;

  if (patch.classificationStatus !== undefined) {
    if (!isClassificationStatus(patch.classificationStatus)) {
      return { ok: false, error: 'Invalid classificationStatus', status: 400 };
    }
    const from = normalizeClassificationStatus(profile.classificationStatus);
    const check = assertDeliberateClassificationChange(from, patch.classificationStatus);
    if (check.ok === false) return { ok: false, error: check.error, status: 400 };
  }

  if (patch.paymentPreference !== undefined && patch.paymentPreference !== null) {
    if (!isPaymentPreference(patch.paymentPreference)) {
      return { ok: false, error: 'Invalid paymentPreference', status: 400 };
    }
  }

  let startDate: Date | null | undefined;
  let inactiveDate: Date | null | undefined;
  try {
    startDate = parseOptionalDate(patch.startDate);
    inactiveDate = parseOptionalDate(patch.inactiveDate);
  } catch {
    return { ok: false, error: 'Invalid date', status: 400 };
  }

  const data = {
    legalFirstName: emptyToNull(patch.legalFirstName),
    legalLastName: emptyToNull(patch.legalLastName),
    publicDisplayName: emptyToNull(patch.publicDisplayName),
    mailingAddressLine1: emptyToNull(patch.mailingAddressLine1),
    mailingAddressLine2: emptyToNull(patch.mailingAddressLine2),
    mailingCity: emptyToNull(patch.mailingCity),
    mailingState: emptyToNull(patch.mailingState),
    mailingPostalCode: emptyToNull(patch.mailingPostalCode),
    mailingCountry: emptyToNull(patch.mailingCountry),
    startDate,
    inactiveDate,
    classificationStatus: patch.classificationStatus,
    paymentPreference:
      patch.paymentPreference === undefined
        ? undefined
        : normalizePaymentPreference(patch.paymentPreference),
    memberStatus:
      patch.memberStatus === undefined
        ? undefined
        : typeof patch.memberStatus === 'string' && patch.memberStatus.trim()
          ? patch.memberStatus.trim()
          : undefined,
  };

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) cleaned[k] = v;
  }

  if (Object.keys(cleaned).length === 0) {
    return { ok: false, error: 'No fields to update', status: 400 };
  }

  const updated = await prisma.cleanerProfile.update({
    where: { userId: cleanerId },
    data: cleaned,
  });

  const auditPayload = buildPrivacySafeAuditChanges(
    cleanerId,
    before,
    updated as unknown as Record<string, unknown>,
    Object.keys(cleaned)
  );

  if (auditPayload.changedFields.length > 0) {
    await logAuditEntry({
      actorId,
      actorRole: 'ADMIN',
      action: 'WORKER_RECORD_UPDATE',
      entityType: 'CleanerProfile',
      entityId: updated.id,
      description: `Worker record updated for cleaner ${cleanerId}`,
      changes: auditPayload as Prisma.InputJsonValue,
    });
  }

  return { ok: true };
}

export async function updateWorkerRecordAsCleaner(params: {
  cleanerId: string;
  patch: CleanerSelfServicePatch;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { cleanerId, patch } = params;
  await ensureCleanerProfile(cleanerId);

  if (patch.paymentPreference !== undefined && patch.paymentPreference !== null) {
    if (!isPaymentPreference(patch.paymentPreference)) {
      return { ok: false, error: 'Invalid paymentPreference', status: 400 };
    }
  }

  const data = {
    publicDisplayName: emptyToNull(patch.publicDisplayName),
    mailingAddressLine1: emptyToNull(patch.mailingAddressLine1),
    mailingAddressLine2: emptyToNull(patch.mailingAddressLine2),
    mailingCity: emptyToNull(patch.mailingCity),
    mailingState: emptyToNull(patch.mailingState),
    mailingPostalCode: emptyToNull(patch.mailingPostalCode),
    mailingCountry: emptyToNull(patch.mailingCountry),
    paymentPreference:
      patch.paymentPreference === undefined
        ? undefined
        : normalizePaymentPreference(patch.paymentPreference),
  };

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) cleaned[k] = v;
  }

  if (Object.keys(cleaned).length === 0) {
    return { ok: false, error: 'No fields to update', status: 400 };
  }

  await prisma.cleanerProfile.update({
    where: { userId: cleanerId },
    data: cleaned,
  });

  // Field names only — never log mailing address values or payment destinations
  await logAuditEntry({
    actorId: cleanerId,
    actorRole: 'CLEANER',
    action: 'WORKER_RECORD_SELF_UPDATE',
    entityType: 'CleanerProfile',
    entityId: cleanerId,
    description: 'Cleaner self-service worker record update',
    changes: { cleanerId, changedFields: Object.keys(cleaned) } as Prisma.InputJsonValue,
  });

  return { ok: true };
}

export async function createWorkerAgreementAsAdmin(params: {
  cleanerId: string;
  actorId: string | null;
  agreementType: string;
  agreementVersion: string;
  status?: string;
  documentReference?: string | null;
  /** Rejected if present — cannot fabricate signed agreements in this phase. */
  signedAt?: unknown;
}): Promise<{ ok: true; id: string } | { ok: false; error: string; status: number }> {
  if (params.signedAt !== undefined && params.signedAt !== null) {
    return {
      ok: false,
      error: 'signedAt cannot be set on create; SIGNED workflow is deferred',
      status: 400,
    };
  }

  const status = params.status ?? 'PENDING';
  if (!isAgreementStatus(status)) {
    return { ok: false, error: 'Invalid agreement status', status: 400 };
  }
  // Create is PENDING-only. No SIGNED / SUPERSEDED / VOID shortcuts.
  if (status !== 'PENDING') {
    return {
      ok: false,
      error: 'Agreements may only be created as PENDING in this phase',
      status: 400,
    };
  }

  const type = params.agreementType?.trim() ?? '';
  const version = params.agreementVersion?.trim() ?? '';
  if (!type || type.length > 80) {
    return { ok: false, error: 'Invalid agreementType', status: 400 };
  }
  if (!version || version.length > 40) {
    return { ok: false, error: 'Invalid agreementVersion', status: 400 };
  }

  const ref = boundOpaqueRef(params.documentReference);
  if (ref.ok === false) return { ok: false, error: ref.error, status: 400 };

  const user = await prisma.user.findUnique({
    where: { id: params.cleanerId, role: 'CLEANER' },
    select: { id: true },
  });
  if (!user) return { ok: false, error: 'Cleaner not found', status: 404 };

  const row = await prisma.workerAgreement.create({
    data: {
      cleanerId: params.cleanerId,
      agreementType: type,
      agreementVersion: version,
      status: 'PENDING',
      issuedAt: new Date(),
      signedAt: null,
      documentReference: ref.value ?? null,
    },
  });

  await logAuditEntry({
    actorId: params.actorId,
    actorRole: 'ADMIN',
    action: 'WORKER_AGREEMENT_CREATE',
    entityType: 'WorkerAgreement',
    entityId: row.id,
    description: `Worker agreement created (${row.agreementType} v${row.agreementVersion})`,
    changes: {
      cleanerId: params.cleanerId,
      changedFields: ['status', 'agreementType', 'agreementVersion'],
      values: { status: { from: null, to: 'PENDING' } },
    } as Prisma.InputJsonValue,
  });

  return { ok: true, id: row.id };
}

/**
 * Document metadata only. No notes dump, no TIN fields, no upload blob.
 * documentReference / externalProviderReference are opaque provider keys (bounded length).
 */
export async function upsertWorkerDocumentMetaAsAdmin(params: {
  cleanerId: string;
  actorId: string | null;
  documentType: string;
  status: string;
  documentReference?: string | null;
  externalProviderReference?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string; status: number }> {
  if (!isDocumentType(params.documentType)) {
    return { ok: false, error: 'Invalid documentType', status: 400 };
  }
  if (!isDocumentStatus(params.status)) {
    return { ok: false, error: 'Invalid document status', status: 400 };
  }

  const docRef = boundOpaqueRef(params.documentReference);
  if (docRef.ok === false) return { ok: false, error: docRef.error, status: 400 };
  const extRef = boundOpaqueRef(params.externalProviderReference);
  if (extRef.ok === false) return { ok: false, error: extRef.error, status: 400 };

  const existing = await prisma.workerDocument.findFirst({
    where: { cleanerId: params.cleanerId, documentType: params.documentType },
    orderBy: { createdAt: 'desc' },
  });

  const receivedAt =
    params.status === 'RECEIVED' ? existing?.receivedAt ?? new Date() : existing?.receivedAt ?? null;

  let id: string;
  if (existing) {
    const updated = await prisma.workerDocument.update({
      where: { id: existing.id },
      data: {
        status: params.status,
        documentReference:
          docRef.value === undefined ? existing.documentReference : docRef.value,
        externalProviderReference:
          extRef.value === undefined ? existing.externalProviderReference : extRef.value,
        receivedAt,
        // notes intentionally not writable in this phase
      },
    });
    id = updated.id;
  } else {
    const created = await prisma.workerDocument.create({
      data: {
        cleanerId: params.cleanerId,
        documentType: params.documentType,
        status: params.status,
        documentReference: docRef.value ?? null,
        externalProviderReference: extRef.value ?? null,
        notes: null,
        receivedAt,
      },
    });
    id = created.id;
  }

  await logAuditEntry({
    actorId: params.actorId,
    actorRole: 'ADMIN',
    action: 'WORKER_DOCUMENT_UPSERT',
    entityType: 'WorkerDocument',
    entityId: id,
    description: `Worker document ${params.documentType} → ${params.status}`,
    changes: {
      cleanerId: params.cleanerId,
      changedFields: ['documentType', 'status'],
      values: {
        documentType: { from: null, to: params.documentType },
        status: { from: existing?.status ?? null, to: params.status },
      },
    } as Prisma.InputJsonValue,
  });

  return { ok: true, id };
}
