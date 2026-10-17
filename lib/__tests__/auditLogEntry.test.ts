import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const auditCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: (...args: unknown[]) => auditCreate(...args),
    },
  },
}));

import { logAuditEntry } from '@/lib/audit';

describe('logAuditEntry actor foreign key', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores a real User id on the first insert', async () => {
    auditCreate.mockResolvedValueOnce({ id: 'audit-1' });

    const id = await logAuditEntry({
      actorId: 'admin-user-1',
      actorRole: 'ADMIN',
      action: 'INVOICE_PAYMENT_RECORDED',
      entityType: 'Invoice',
      entityId: 'inv-1',
      changes: { amount: 25 },
    });

    expect(id).toBeTruthy();
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate.mock.calls[0][0].data.actorId).toBe('admin-user-1');
  });

  it('retries without actorId when the User foreign key rejects', async () => {
    auditCreate
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('FK', {
          code: 'P2003',
          clientVersion: 'test',
        })
      )
      .mockResolvedValueOnce({ id: 'audit-2' });

    const id = await logAuditEntry({
      actorId: 'not-a-user',
      actorRole: 'ADMIN',
      action: 'INVOICE_PAYMENT_RECORDED',
      entityType: 'Invoice',
      entityId: 'inv-1',
      changes: { amount: 25 },
    });

    expect(id).toBeTruthy();
    expect(auditCreate).toHaveBeenCalledTimes(2);
    expect(auditCreate.mock.calls[1][0].data.actorId).toBeNull();
    expect(auditCreate.mock.calls[1][0].data.actorRole).toBe('ADMIN');
    expect(auditCreate.mock.calls[1][0].data.changes).toEqual({
      amount: 25,
      actorIdRejected: 'not-a-user',
    });
  });

  it('does not retry a non-foreign-key failure', async () => {
    auditCreate.mockRejectedValueOnce(new Error('database down'));

    const id = await logAuditEntry({
      actorId: 'admin-user-1',
      actorRole: 'ADMIN',
      action: 'INVOICE_PAYMENT_RECORDED',
      entityType: 'Invoice',
      entityId: 'inv-1',
    });

    expect(id).toBeNull();
    expect(auditCreate).toHaveBeenCalledTimes(1);
  });
});
