/**
 * Phase 7D-2 worker record foundation tests.
 * Proves classification defaults, no inference, no fabricated agreements,
 * audit privacy, auth field allowlists, and compensation summary sourcing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_CLASSIFICATION_STATUS,
  normalizeClassificationStatus,
  isClassificationStatus,
  assertDeliberateClassificationChange,
} from '@/lib/workers/classification';
import {
  isPaymentPreference,
  normalizePaymentPreference,
} from '@/lib/workers/paymentPreference';
import { isAgreementStatus } from '@/lib/workers/agreements';
import { isDocumentStatus } from '@/lib/workers/documents';

const mocks = vi.hoisted(() => ({
  findUniqueUser: vi.fn(),
  findUniqueProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  findManyPayout: vi.fn(),
  findManyTip: vi.fn(),
  countJob: vi.fn(),
  findManyAgreement: vi.fn(),
  findManyDocument: vi.fn(),
  findFirstDocument: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  createAgreement: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => mocks.findUniqueUser(...a) },
    cleanerProfile: {
      findUnique: (...a: unknown[]) => mocks.findUniqueProfile(...a),
      create: (...a: unknown[]) => mocks.createProfile(...a),
      update: (...a: unknown[]) => mocks.updateProfile(...a),
    },
    jobPayout: { findMany: (...a: unknown[]) => mocks.findManyPayout(...a) },
    tip: { findMany: (...a: unknown[]) => mocks.findManyTip(...a) },
    job: { count: (...a: unknown[]) => mocks.countJob(...a) },
    workerAgreement: {
      findMany: (...a: unknown[]) => mocks.findManyAgreement(...a),
      create: (...a: unknown[]) => mocks.createAgreement(...a),
    },
    workerDocument: {
      findMany: (...a: unknown[]) => mocks.findManyDocument(...a),
      findFirst: (...a: unknown[]) => mocks.findFirstDocument(...a),
      create: (...a: unknown[]) => mocks.createDocument(...a),
      update: (...a: unknown[]) => mocks.updateDocument(...a),
    },
    auditLog: { create: (...a: unknown[]) => mocks.auditCreate(...a) },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: vi.fn().mockResolvedValue('audit-1'),
}));

import { ensureCleanerProfile } from '@/lib/workers/ensureCleanerProfile';
import { getWorkerCompensationSummary } from '@/lib/workers/compensationSummary';
import { getWorkerRecord } from '@/lib/workers/getWorkerRecord';
import {
  createWorkerAgreementAsAdmin,
  updateWorkerRecordAsAdmin,
  updateWorkerRecordAsCleaner,
  upsertWorkerDocumentMetaAsAdmin,
} from '@/lib/workers/updateWorkerRecord';
import { logAuditEntry } from '@/lib/audit';

describe('Phase 7D-2 classification safety', () => {
  it('defaults to UNRESOLVED', () => {
    expect(DEFAULT_CLASSIFICATION_STATUS).toBe('UNRESOLVED');
    expect(normalizeClassificationStatus(null)).toBe('UNRESOLVED');
    expect(normalizeClassificationStatus(undefined)).toBe('UNRESOLVED');
    expect(normalizeClassificationStatus('')).toBe('UNRESOLVED');
    expect(normalizeClassificationStatus('garbage')).toBe('UNRESOLVED');
  });

  it('never treats application-like strings as classification', () => {
    expect(isClassificationStatus('independentContractor')).toBe(false);
    expect(isClassificationStatus('contractor')).toBe(false);
    expect(isClassificationStatus('1099')).toBe(false);
    expect(normalizeClassificationStatus('INDEPENDENT_CONTRACTOR')).toBe(
      'INDEPENDENT_CONTRACTOR'
    );
  });

  it('allows only deliberate enum transitions (no auto-inference helper)', () => {
    expect(assertDeliberateClassificationChange('UNRESOLVED', 'EMPLOYEE').ok).toBe(true);
    expect(
      assertDeliberateClassificationChange('UNRESOLVED', 'INDEPENDENT_CONTRACTOR').ok
    ).toBe(true);
  });
});

describe('Phase 7D-2 ensureCleanerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates profile with UNRESOLVED and does not invent address/startDate', async () => {
    mocks.findUniqueProfile.mockResolvedValue(null);
    mocks.createProfile.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'cp-1',
      userId: data.userId,
      classificationStatus: data.classificationStatus,
      mailingAddressLine1: null,
      startDate: null,
      paymentPreference: null,
      ...data,
    }));

    const profile = await ensureCleanerProfile('cleaner-1');
    expect(mocks.createProfile).toHaveBeenCalledWith({
      data: {
        userId: 'cleaner-1',
        classificationStatus: 'UNRESOLVED',
      },
    });
    expect(profile.classificationStatus).toBe('UNRESOLVED');
    expect(profile.mailingAddressLine1).toBeNull();
    expect(profile.startDate).toBeNull();
  });

  it('does not overwrite existing cleaner profile (Dorottya-safe)', async () => {
    mocks.findUniqueProfile.mockResolvedValue({
      id: 'cp-existing',
      userId: 'dorottya',
      classificationStatus: 'UNRESOLVED',
      mailingAddressLine1: null,
      startDate: null,
    });
    const profile = await ensureCleanerProfile('dorottya');
    expect(mocks.createProfile).not.toHaveBeenCalled();
    expect(profile.userId).toBe('dorottya');
    expect(profile.classificationStatus).toBe('UNRESOLVED');
  });
});

describe('Phase 7D-2 getWorkerRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueUser.mockResolvedValue({
      id: 'cleaner-1',
      email: 'c@example.com',
      phone: null,
      name: 'Cleaner One',
      isActive: true,
      Branch_User_primaryBranchIdToBranch: null,
    });
    mocks.findUniqueProfile.mockResolvedValue({
      id: 'cp-1',
      userId: 'cleaner-1',
      firstName: null,
      lastName: null,
      legalFirstName: null,
      legalLastName: null,
      publicDisplayName: null,
      mailingAddressLine1: null,
      mailingAddressLine2: null,
      mailingCity: null,
      mailingState: null,
      mailingPostalCode: null,
      mailingCountry: null,
      startDate: null,
      inactiveDate: null,
      classificationStatus: 'UNRESOLVED',
      paymentPreference: null,
      memberStatus: 'ACTIVE',
    });
    mocks.findManyAgreement.mockResolvedValue([]);
    mocks.findManyDocument.mockResolvedValue([]);
    mocks.findManyPayout.mockResolvedValue([]);
    mocks.findManyTip.mockResolvedValue([]);
    mocks.countJob.mockResolvedValue(0);
  });

  it('returns UNRESOLVED, null address, no fabricated agreements, W9 NOT_REQUESTED', async () => {
    const record = await getWorkerRecord('cleaner-1');
    expect(record).not.toBeNull();
    expect(record!.workStatus.classificationStatus).toBe('UNRESOLVED');
    expect(record!.identity.mailingAddressLine1).toBeNull();
    expect(record!.workStatus.startDate).toBeNull();
    expect(record!.documentation.agreements).toEqual([]);
    expect(record!.documentation.w9MetaStatus).toBe('NOT_REQUESTED');
    expect(record!.paymentPreference).toBeNull();
  });
});

describe('Phase 7D-2 admin / cleaner updates + audit privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueUser.mockResolvedValue({ id: 'cleaner-1' });
    mocks.findUniqueProfile.mockResolvedValue({
      id: 'cp-1',
      userId: 'cleaner-1',
      classificationStatus: 'UNRESOLVED',
      legalFirstName: null,
      paymentPreference: null,
      memberStatus: 'ACTIVE',
      mailingAddressLine1: null,
      mailingCity: null,
      mailingState: null,
      mailingPostalCode: null,
      startDate: null,
      inactiveDate: null,
      legalLastName: null,
    });
    mocks.updateProfile.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'cp-1',
      userId: 'cleaner-1',
      classificationStatus: 'UNRESOLVED',
      legalFirstName: null,
      paymentPreference: null,
      memberStatus: 'ACTIVE',
      mailingAddressLine1: null,
      mailingCity: null,
      mailingState: null,
      mailingPostalCode: null,
      startDate: null,
      inactiveDate: null,
      legalLastName: null,
      ...data,
    }));
  });

  it('audits classification with values but not mailing address contents', async () => {
    const result = await updateWorkerRecordAsAdmin({
      cleanerId: 'cleaner-1',
      actorId: 'admin-1',
      patch: {
        classificationStatus: 'EMPLOYEE',
        mailingAddressLine1: '123 Secret Lane',
        mailingCity: 'Burlington',
      },
    });
    expect(result.ok).toBe(true);
    expect(logAuditEntry).toHaveBeenCalled();
    const call = vi.mocked(logAuditEntry).mock.calls[0][0];
    expect(call.action).toBe('WORKER_RECORD_UPDATE');
    const changes = call.changes as {
      changedFields: string[];
      values?: Record<string, unknown>;
    };
    expect(changes.changedFields).toContain('classificationStatus');
    expect(changes.changedFields).toContain('mailingAddressLine1');
    expect(changes.values?.classificationStatus).toBeTruthy();
    expect(changes.values?.mailingAddressLine1).toBeUndefined();
    expect(JSON.stringify(call.changes)).not.toContain('123 Secret Lane');
    expect(JSON.stringify(call.changes)).not.toContain('Burlington');
  });

  it('ignores non-allowlisted admin patch keys (no credential dump path)', async () => {
    const result = await updateWorkerRecordAsAdmin({
      cleanerId: 'cleaner-1',
      actorId: 'admin-1',
      patch: {
        paymentPreference: 'ZELLE',
        bankAccountNumber: '999999',
        routingNumber: '011000015',
        tin: '123456789',
      } as Record<string, unknown>,
    });
    expect(result.ok).toBe(true);
    const data = mocks.updateProfile.mock.calls[0][0].data;
    expect(data.paymentPreference).toBe('ZELLE');
    expect(data.bankAccountNumber).toBeUndefined();
    expect(data.routingNumber).toBeUndefined();
    expect(data.tin).toBeUndefined();
  });

  it('cleaner self-service cannot set classification via update helper fields', async () => {
    const result = await updateWorkerRecordAsCleaner({
      cleanerId: 'cleaner-1',
      patch: { publicDisplayName: 'Dee', paymentPreference: 'ZELLE' },
    });
    expect(result.ok).toBe(true);
    const data = mocks.updateProfile.mock.calls[0][0].data;
    expect(data.classificationStatus).toBeUndefined();
    expect(data.legalFirstName).toBeUndefined();
    expect(data.publicDisplayName).toBe('Dee');
    expect(data.paymentPreference).toBe('ZELLE');
    const call = vi.mocked(logAuditEntry).mock.calls[0][0];
    expect(JSON.stringify(call.changes)).not.toContain('Dee');
    expect((call.changes as { changedFields: string[] }).changedFields).toContain(
      'publicDisplayName'
    );
  });

  it('refuses creating SIGNED agreement in one step (no fabrication shortcut)', async () => {
    const result = await createWorkerAgreementAsAdmin({
      cleanerId: 'cleaner-1',
      actorId: 'admin-1',
      agreementType: 'VERMONT_WORKER_AGREEMENT',
      agreementVersion: '1.0',
      status: 'SIGNED',
    });
    expect(result.ok).toBe(false);
    expect(mocks.createAgreement).not.toHaveBeenCalled();
  });

  it('refuses signedAt on agreement create', async () => {
    const result = await createWorkerAgreementAsAdmin({
      cleanerId: 'cleaner-1',
      actorId: 'admin-1',
      agreementType: 'VERMONT_WORKER_AGREEMENT',
      agreementVersion: '1.0',
      signedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(false);
    expect(mocks.createAgreement).not.toHaveBeenCalled();
  });

  it('creates PENDING agreement with signedAt null only', async () => {
    mocks.createAgreement.mockResolvedValue({
      id: 'agr-1',
      agreementType: 'VERMONT_WORKER_AGREEMENT',
      agreementVersion: '1.0',
      status: 'PENDING',
    });
    const result = await createWorkerAgreementAsAdmin({
      cleanerId: 'cleaner-1',
      actorId: 'admin-1',
      agreementType: 'VERMONT_WORKER_AGREEMENT',
      agreementVersion: '1.0',
    });
    expect(result.ok).toBe(true);
    const data = mocks.createAgreement.mock.calls[0][0].data;
    expect(data.status).toBe('PENDING');
    expect(data.signedAt).toBeNull();
  });

  it('document upsert writes metadata without notes field', async () => {
    mocks.findFirstDocument.mockResolvedValue(null);
    mocks.createDocument.mockResolvedValue({ id: 'doc-1' });
    const result = await upsertWorkerDocumentMetaAsAdmin({
      cleanerId: 'cleaner-1',
      actorId: 'admin-1',
      documentType: 'W9_META',
      status: 'REQUESTED',
      documentReference: 'provider:w9:abc',
    });
    expect(result.ok).toBe(true);
    const data = mocks.createDocument.mock.calls[0][0].data;
    expect(data.notes).toBeNull();
    expect(data.documentType).toBe('W9_META');
    expect(data.status).toBe('REQUESTED');
    const call = vi.mocked(logAuditEntry).mock.calls[0][0];
    expect(JSON.stringify(call.changes)).not.toContain('provider:w9:abc');
  });
});

describe('Phase 7D-2 compensation summary (JobPayout + Tip only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates service + tip cents without storing profile totals', async () => {
    mocks.findManyPayout.mockResolvedValue([
      { cleanerAmount: 100, status: 'READY' },
      { cleanerAmount: 50, status: 'PAID' },
    ]);
    mocks.findManyTip.mockResolvedValue([
      { amount: 2000, status: 'RECEIVED' },
      { amount: 1500, status: 'PAID_OUT' },
    ]);
    mocks.countJob.mockResolvedValue(3);

    const summary = await getWorkerCompensationSummary('cleaner-1');
    expect(summary.serviceEarnedCents).toBe(15000);
    expect(summary.servicePaidCents).toBe(5000);
    expect(summary.tipsEarnedCents).toBe(3500);
    expect(summary.tipsPaidCents).toBe(1500);
    expect(summary.totalPaidCents).toBe(6500);
    expect(summary.outstandingPayableCents).toBe(12000);
    expect(summary.jobsCompleted).toBe(3);
  });
});

describe('Phase 7D-2 enums', () => {
  it('payment preference and agreement/document statuses are closed sets', () => {
    expect(isPaymentPreference('ZELLE')).toBe(true);
    expect(isPaymentPreference('BANK')).toBe(false);
    expect(normalizePaymentPreference(null)).toBeNull();
    expect(isAgreementStatus('PENDING')).toBe(true);
    expect(isAgreementStatus('SIGNED')).toBe(true);
    expect(isDocumentStatus('NOT_REQUESTED')).toBe(true);
  });
});
