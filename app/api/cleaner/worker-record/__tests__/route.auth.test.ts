/**
 * Auth / IDOR guards for cleaner worker-record API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  getWorkerRecord: vi.fn(),
  updateWorkerRecordAsCleaner: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/workers/getWorkerRecord', () => ({
  getWorkerRecord: (...a: unknown[]) => mocks.getWorkerRecord(...a),
}));

vi.mock('@/lib/workers/updateWorkerRecord', () => ({
  updateWorkerRecordAsCleaner: (...a: unknown[]) => mocks.updateWorkerRecordAsCleaner(...a),
}));

import { GET as cleanerGet, PATCH as cleanerPatch } from '@/app/api/cleaner/worker-record/route';

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost'), init);
}

describe('cleaner worker-record auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ userId: 'cleaner-session', role: 'CLEANER' });
    mocks.getWorkerRecord.mockResolvedValue({
      cleanerId: 'cleaner-session',
      email: 'c@example.com',
      phone: null,
      displayName: 'C',
      identity: {
        preferredDisplayName: 'C',
        firstName: null,
        lastName: null,
        legalFirstName: 'Hidden',
        legalLastName: 'Legal',
        mailingAddressLine1: null,
        mailingAddressLine2: null,
        mailingCity: null,
        mailingState: null,
        mailingPostalCode: null,
        mailingCountry: null,
      },
      workStatus: {
        classificationStatus: 'UNRESOLVED',
        memberStatus: 'ACTIVE',
        isActive: true,
        startDate: null,
        inactiveDate: null,
        primaryBranch: null,
      },
      documentation: { w9MetaStatus: 'NOT_REQUESTED', agreements: [], documents: [] },
      paymentPreference: null,
      compensationSummary: {
        serviceEarnedCents: 0,
        servicePaidCents: 0,
        tipsEarnedCents: 0,
        tipsPaidCents: 0,
        totalPaidCents: 0,
        outstandingPayableCents: 0,
        jobsCompleted: 0,
      },
    });
  });

  it('GET uses session userId only (ignores query cleanerId)', async () => {
    const res = await cleanerGet(
      req('http://localhost/api/cleaner/worker-record?cleanerId=other-cleaner')
    );
    expect(res.status).toBe(200);
    expect(mocks.getWorkerRecord).toHaveBeenCalledWith('cleaner-session');
    expect(mocks.getWorkerRecord).not.toHaveBeenCalledWith('other-cleaner');
    const body = await res.json();
    expect(body.record.identity.legalFirstName).toBeUndefined();
  });

  it('PATCH rejects classificationStatus', async () => {
    const res = await cleanerPatch(
      req('http://localhost/api/cleaner/worker-record', {
        method: 'PATCH',
        body: JSON.stringify({ classificationStatus: 'EMPLOYEE' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(res.status).toBe(403);
    expect(mocks.updateWorkerRecordAsCleaner).not.toHaveBeenCalled();
  });

  it('PATCH rejects legal name and agreement/document keys', async () => {
    for (const payload of [
      { legalFirstName: 'X' },
      { agreement: { agreementType: 'X' } },
      { document: { documentType: 'W9_META' } },
      { memberStatus: 'INACTIVE' },
      { cleanerId: 'other' },
    ]) {
      const res = await cleanerPatch(
        req('http://localhost/api/cleaner/worker-record', {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(res.status).toBe(403);
    }
    expect(mocks.updateWorkerRecordAsCleaner).not.toHaveBeenCalled();
  });

  it('PATCH always targets session cleaner, never body cleanerId', async () => {
    mocks.updateWorkerRecordAsCleaner.mockResolvedValue({ ok: true });
    const res = await cleanerPatch(
      req('http://localhost/api/cleaner/worker-record', {
        method: 'PATCH',
        body: JSON.stringify({ publicDisplayName: 'Dee' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.updateWorkerRecordAsCleaner).toHaveBeenCalledWith({
      cleanerId: 'cleaner-session',
      patch: expect.objectContaining({ publicDisplayName: 'Dee' }),
    });
  });
});
