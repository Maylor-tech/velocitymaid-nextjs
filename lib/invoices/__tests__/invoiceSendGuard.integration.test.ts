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

// Integration coverage of the send route is intentional; lib/ tests are otherwise
// barred from importing Phase 1 admin modules.
// eslint-disable-next-line no-restricted-imports
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

describe('send route — R1 warning-acknowledgement reason enforced by API', () => {
  // A linked job whose total differs from the invoice raises the overridable
  // INVOICE_JOB_TOTAL_MISMATCH warning without any hard error.
  const INVOICE_WITH_MISMATCHED_JOB = {
    ...DRAFT_INVOICE,
    Job: {
      id: 'job1',
      address: '198 Chipman Park, Middlebury, VT 05753',
      preferredDate: new Date('2026-08-23T00:00:00.000Z'),
      totalPrice: 500.63,
      quotedTotal: null,
      customerId: 'cust-chris',
      customerName: 'Chris Ray Hautchamp',
      Customer: {
        id: 'cust-chris',
        email: 'hautchamp26@gmail.com',
        firstName: 'Chris',
        lastName: 'Hautchamp',
      },
    },
  };

  beforeEach(() => {
    invoiceFindUnique.mockResolvedValue(INVOICE_WITH_MISMATCHED_JOB);
  });

  it('rejects an acknowledgement submitted without a reason (400, no email/claim)', async () => {
    const res = await POST(
      req({
        reimbursementsConfirmed: true,
        acknowledgeWarnings: ['INVOICE_JOB_TOTAL_MISMATCH'],
        // acknowledgeWarningReasons intentionally omitted
      }),
      { params: { id: 'inv1' } }
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errors.map((e: { code: string }) => e.code)).toContain(
      'INVOICE_WARNING_ACK_REASON_REQUIRED'
    );
    expect(invoiceUpdateMany).not.toHaveBeenCalled();
    expect(sendInvoiceSentEmail).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only reason', async () => {
    const res = await POST(
      req({
        reimbursementsConfirmed: true,
        acknowledgeWarnings: ['INVOICE_JOB_TOTAL_MISMATCH'],
        acknowledgeWarningReasons: { INVOICE_JOB_TOTAL_MISMATCH: '   ' },
      }),
      { params: { id: 'inv1' } }
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors.map((e: { code: string }) => e.code)).toContain(
      'INVOICE_WARNING_ACK_REASON_REQUIRED'
    );
    expect(sendInvoiceSentEmail).not.toHaveBeenCalled();
  });

  it('sends when the acknowledgement carries a real reason', async () => {
    invoiceUpdateMany.mockResolvedValue({ count: 1 });
    const res = await POST(
      req({
        reimbursementsConfirmed: true,
        acknowledgeWarnings: ['INVOICE_JOB_TOTAL_MISMATCH'],
        acknowledgeWarningReasons: {
          INVOICE_JOB_TOTAL_MISMATCH: 'Added $200.63 of approved reimbursements.',
        },
      }),
      { params: { id: 'inv1' } }
    );
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
