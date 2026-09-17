/**
 * Auth guards for admin worker-record API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  getWorkerRecord: vi.fn(),
  updateWorkerRecordAsAdmin: vi.fn(),
  createWorkerAgreementAsAdmin: vi.fn(),
  upsertWorkerDocumentMetaAsAdmin: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/workers/getWorkerRecord', () => ({
  getWorkerRecord: (...a: unknown[]) => mocks.getWorkerRecord(...a),
}));

vi.mock('@/lib/workers/updateWorkerRecord', () => ({
  updateWorkerRecordAsAdmin: (...a: unknown[]) => mocks.updateWorkerRecordAsAdmin(...a),
  createWorkerAgreementAsAdmin: (...a: unknown[]) => mocks.createWorkerAgreementAsAdmin(...a),
  upsertWorkerDocumentMetaAsAdmin: (...a: unknown[]) =>
    mocks.upsertWorkerDocumentMetaAsAdmin(...a),
}));

import {
  GET as adminGet,
  PATCH as adminPatch,
} from '@/app/api/admin/cleaners/[cleanerId]/worker-record/route';

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost'), init);
}

describe('admin worker-record auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    mocks.getWorkerRecord.mockResolvedValue({ cleanerId: 'c1' });
    mocks.updateWorkerRecordAsAdmin.mockResolvedValue({ ok: true });
    mocks.createWorkerAgreementAsAdmin.mockResolvedValue({ ok: true, id: 'a1' });
    mocks.upsertWorkerDocumentMetaAsAdmin.mockResolvedValue({ ok: true, id: 'd1' });
  });

  it('GET requires ADMIN role', async () => {
    await adminGet(req('http://localhost/api/admin/cleaners/c1/worker-record'), {
      params: { cleanerId: 'c1' },
    });
    expect(mocks.requireRole).toHaveBeenCalledWith(expect.anything(), 'ADMIN');
  });

  it('rejects agreement signedAt on create', async () => {
    const res = await adminPatch(
      req('http://localhost/api/admin/cleaners/c1/worker-record', {
        method: 'PATCH',
        body: JSON.stringify({
          agreement: {
            agreementType: 'VERMONT_WORKER_AGREEMENT',
            agreementVersion: '1.0',
            signedAt: '2026-01-01',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { cleanerId: 'c1' } }
    );
    expect(res.status).toBe(400);
    expect(mocks.createWorkerAgreementAsAdmin).not.toHaveBeenCalled();
  });

  it('rejects document notes writes', async () => {
    const res = await adminPatch(
      req('http://localhost/api/admin/cleaners/c1/worker-record', {
        method: 'PATCH',
        body: JSON.stringify({
          document: {
            documentType: 'W9_META',
            status: 'REQUESTED',
            notes: 'contains something sensitive',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { cleanerId: 'c1' } }
    );
    expect(res.status).toBe(400);
    expect(mocks.upsertWorkerDocumentMetaAsAdmin).not.toHaveBeenCalled();
  });
});
