/**
 * Auth + single-operation integrity for admin worker-record API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

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
import { countAdminWorkerRecordOperations } from '@/lib/workers/adminWorkerRecordOps';

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost'), init);
}

async function patchBody(body: unknown) {
  return adminPatch(
    req('http://localhost/api/admin/cleaners/c1/worker-record', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    { params: { cleanerId: 'c1' } }
  );
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
    const res = await patchBody({
      agreement: {
        agreementType: 'VERMONT_WORKER_AGREEMENT',
        agreementVersion: '1.0',
        signedAt: '2026-01-01',
      },
    });
    expect(res.status).toBe(400);
    expect(mocks.createWorkerAgreementAsAdmin).not.toHaveBeenCalled();
  });

  it('rejects document notes writes', async () => {
    const res = await patchBody({
      document: {
        documentType: 'W9_META',
        status: 'REQUESTED',
        notes: 'contains something sensitive',
      },
    });
    expect(res.status).toBe(400);
    expect(mocks.upsertWorkerDocumentMetaAsAdmin).not.toHaveBeenCalled();
  });
});

describe('admin worker-record single-operation integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    mocks.getWorkerRecord.mockResolvedValue({ cleanerId: 'c1' });
    mocks.updateWorkerRecordAsAdmin.mockResolvedValue({ ok: true });
    mocks.createWorkerAgreementAsAdmin.mockResolvedValue({ ok: true, id: 'a1' });
    mocks.upsertWorkerDocumentMetaAsAdmin.mockResolvedValue({ ok: true, id: 'd1' });
  });

  function expectZeroWrites() {
    expect(mocks.updateWorkerRecordAsAdmin).not.toHaveBeenCalled();
    expect(mocks.createWorkerAgreementAsAdmin).not.toHaveBeenCalled();
    expect(mocks.upsertWorkerDocumentMetaAsAdmin).not.toHaveBeenCalled();
  }

  it('1. patch + agreement together → 400 and zero writes', async () => {
    const res = await patchBody({
      patch: { paymentPreference: 'ZELLE' },
      agreement: { agreementType: 'VERMONT_WORKER_AGREEMENT', agreementVersion: '1.0' },
    });
    expect(res.status).toBe(400);
    expectZeroWrites();
  });

  it('2. patch + document together → 400 and zero writes', async () => {
    const res = await patchBody({
      patch: { paymentPreference: 'ZELLE' },
      document: { documentType: 'W9_META', status: 'REQUESTED' },
    });
    expect(res.status).toBe(400);
    expectZeroWrites();
  });

  it('3. agreement + document together → 400 and zero writes', async () => {
    const res = await patchBody({
      agreement: { agreementType: 'VERMONT_WORKER_AGREEMENT', agreementVersion: '1.0' },
      document: { documentType: 'W9_META', status: 'REQUESTED' },
    });
    expect(res.status).toBe(400);
    expectZeroWrites();
  });

  it('4. all three → 400 and zero writes', async () => {
    const res = await patchBody({
      patch: { paymentPreference: 'ZELLE' },
      agreement: { agreementType: 'VERMONT_WORKER_AGREEMENT', agreementVersion: '1.0' },
      document: { documentType: 'W9_META', status: 'REQUESTED' },
    });
    expect(res.status).toBe(400);
    expectZeroWrites();
  });

  it('5. no operation → 400 and zero writes', async () => {
    const res = await patchBody({});
    expect(res.status).toBe(400);
    expectZeroWrites();
  });

  it('6. rejected multi-operation request performs ZERO writes', async () => {
    expect(countAdminWorkerRecordOperations({ patch: {}, agreement: {} }).count).toBe(2);
    const res = await patchBody({
      patch: { classificationStatus: 'EMPLOYEE' },
      agreement: { agreementType: 'X', agreementVersion: '1' },
    });
    expect(res.status).toBe(400);
    expectZeroWrites();
    expect(mocks.getWorkerRecord).not.toHaveBeenCalled();
  });

  it('7. single patch still succeeds', async () => {
    const res = await patchBody({ patch: { paymentPreference: 'ZELLE' } });
    expect(res.status).toBe(200);
    expect(mocks.updateWorkerRecordAsAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.createWorkerAgreementAsAdmin).not.toHaveBeenCalled();
    expect(mocks.upsertWorkerDocumentMetaAsAdmin).not.toHaveBeenCalled();
  });

  it('8. single agreement still succeeds', async () => {
    const res = await patchBody({
      agreement: { agreementType: 'VERMONT_WORKER_AGREEMENT', agreementVersion: '1.0' },
    });
    expect(res.status).toBe(200);
    expect(mocks.createWorkerAgreementAsAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.updateWorkerRecordAsAdmin).not.toHaveBeenCalled();
    expect(mocks.upsertWorkerDocumentMetaAsAdmin).not.toHaveBeenCalled();
  });

  it('9. single document still succeeds', async () => {
    const res = await patchBody({
      document: { documentType: 'W9_META', status: 'REQUESTED' },
    });
    expect(res.status).toBe(200);
    expect(mocks.upsertWorkerDocumentMetaAsAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.updateWorkerRecordAsAdmin).not.toHaveBeenCalled();
    expect(mocks.createWorkerAgreementAsAdmin).not.toHaveBeenCalled();
  });
});

describe('7D-2 migration FK retention safety', () => {
  it('WorkerAgreement and WorkerDocument use ON DELETE RESTRICT (not CASCADE)', () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        'prisma/migrations/20260917040000_worker_record_foundation/migration.sql'
      ),
      'utf8'
    );
    expect(sql).toMatch(
      /WorkerAgreement_cleanerId_fkey[\s\S]*ON DELETE RESTRICT/
    );
    expect(sql).toMatch(
      /WorkerDocument_cleanerId_fkey[\s\S]*ON DELETE RESTRICT/
    );
    expect(sql).not.toMatch(/WorkerAgreement_cleanerId_fkey[\s\S]*ON DELETE CASCADE/);
    expect(sql).not.toMatch(/WorkerDocument_cleanerId_fkey[\s\S]*ON DELETE CASCADE/);

    const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
    expect(schema).toMatch(
      /model WorkerAgreement[\s\S]*onDelete:\s*Restrict/
    );
    expect(schema).toMatch(
      /model WorkerDocument[\s\S]*onDelete:\s*Restrict/
    );
  });
});
