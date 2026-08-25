/**
 * Incident #001 — send route integration (route-level mocks).
 *
 * Proves at the route boundary that:
 *   - an unresolved-reimbursement invoice cannot be sent (C8b), and
 *   - a concurrent second send cannot dispatch a second email (atomic claim).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
const invoiceFindUnique = vi.fn();
const invoiceFindMany = vi.fn();
const invoiceCount = vi.fn();
const invoiceUpdateMany = vi.fn();
const sendInvoiceSentEmail = vi.fn();
const logAuditEntry = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findUnique: (...a: unknown[]) => invoiceFindUnique(...a),
      findMany: (...a: unknown[]) => invoiceFindMany(...a),
      count: (...a: unknown[]) => invoiceCount(...a),
      updateMany: (...a: unknown[]) => invoiceUpdateMany(...a),
    },
  },
}));

vi.mock('@/lib/email/invoiceEmails', () => ({
  sendInvoiceSentEmail: (...a: unknown[]) => sendInvoiceSentEmail(...a),
}));

vi.mock('@/lib/invoices/serializeInvoice', () => ({
  serializeInvoice: (inv: unknown) => inv,
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => logAuditEntry(...a),
}));

import { POST } from '@/app/api/admin/invoices/[id]/send/route';

const DRAFT_INVOICE = {
  id: 'inv1',
  invoiceNumber: 'VM-2026-0100',
  status: 'DRAFT',
  clientEmail: 'hautchamp26@gmail.com',
  clientName: 'Chris Ray Hautchamp',
  customerId: 'cust-chris',
  propertyAddress: '198 Chipman Park, Middlebury, VT 05753',
  jobDate: new Date('2026-08-23T00:00:00.000Z'),
  subtotal: 300,
  tax: 0,
  discount: 0,
  total: 300,
  sentAt: null,
  items: [{ lineTotal: 300 }],
  payments: [],
  Job: null,
};

function req(body: unknown) {
  return { json: async () => body } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRole.mockResolvedValue({ userId: 'admin1', role: 'ADMIN' });
  invoiceFindUnique.mockResolvedValue(DRAFT_INVOICE);
  invoiceFindMany.mockResolvedValue([]);
  invoiceCount.mockResolvedValue(0);
  sendInvoiceSentEmail.mockResolvedValue({ sent: true });
});

describe('send route — reimbursement gate (C8b)', () => {
  it('chipman-0022-unresolved-reimbursement-blocked: blocks send without confirmation', async () => {
    const res = await POST(req({}), { params: { id: 'inv1' } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errors.map((e: { code: string }) => e.code)).toContain(
      'INVOICE_REIMBURSEMENTS_UNCONFIRMED'
    );
    expect(invoiceUpdateMany).not.toHaveBeenCalled();
    expect(sendInvoiceSentEmail).not.toHaveBeenCalled();
  });

  it('sends when reimbursements are confirmed', async () => {
    invoiceUpdateMany.mockResolvedValue({ count: 1 });
    const res = await POST(req({ reimbursementsConfirmed: true }), { params: { id: 'inv1' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(sendInvoiceSentEmail).toHaveBeenCalledTimes(1);
  });
});

describe('send route — idempotency (atomic claim)', () => {
  it('concurrent-send-is-idempotent: exactly one email dispatched', async () => {
    // Model the race: both reads see DRAFT and pass validation; only one claim
    // (updateMany) wins with count === 1, the other gets count === 0.
    invoiceUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const [res1, res2] = await Promise.all([
      POST(req({ reimbursementsConfirmed: true }), { params: { id: 'inv1' } }),
      POST(req({ reimbursementsConfirmed: true }), { params: { id: 'inv1' } }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const conflict = res1.status === 409 ? res1 : res2;
    const conflictJson = await conflict.json();
    expect(conflictJson.code).toBe('INVOICE_ALREADY_SENT');

    // The single most important assertion for this incident:
    expect(sendInvoiceSentEmail).toHaveBeenCalledTimes(1);
  });
});
