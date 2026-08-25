/**
 * Incident #001 — PATCH immutability at the route boundary.
 * Proves a SENT invoice cannot be financially mutated (chipman-silent-mutation-blocked).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
const invoiceFindUnique = vi.fn();
const invoiceUpdate = vi.fn();
const invoiceItemDeleteMany = vi.fn();
const invoiceItemCreateMany = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findUnique: (...a: unknown[]) => invoiceFindUnique(...a),
      update: (...a: unknown[]) => invoiceUpdate(...a),
    },
    invoiceItem: {
      deleteMany: (...a: unknown[]) => invoiceItemDeleteMany(...a),
      createMany: (...a: unknown[]) => invoiceItemCreateMany(...a),
    },
  },
}));

vi.mock('@/lib/invoices/invoiceService', () => ({
  buildInvoiceAmounts: () => ({ subtotal: 500.63, total: 500.63 }),
  mapItemsForCreate: (items: unknown[]) => items,
  refreshInvoiceStatus: vi.fn(),
}));

vi.mock('@/lib/invoices/serializeInvoice', () => ({
  serializeInvoice: (inv: unknown) => inv,
}));

import { PATCH } from '@/app/api/admin/invoices/[id]/route';

const SENT_INVOICE = {
  id: 'inv1',
  status: 'SENT',
  sentAt: new Date('2026-08-23T12:00:00.000Z'),
  clientName: 'Chris Ray Hautchamp',
  clientEmail: 'hautchamp26@gmail.com',
  propertyAddress: '198 Chipman Park, Middlebury, VT 05753',
  serviceType: 'Turnover clean',
  jobDate: new Date('2026-08-23T00:00:00.000Z'),
  dueDate: new Date('2026-08-30T00:00:00.000Z'),
  subtotal: 300,
  tax: 0,
  discount: 0,
  total: 300,
  amountPaid: 0,
  items: [{ description: 'Turnover clean', quantity: 1, unitPrice: 300 }],
  payments: [],
};

function req(body: unknown) {
  return { json: async () => body } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRole.mockResolvedValue({ userId: 'admin1', role: 'ADMIN' });
  invoiceFindUnique.mockResolvedValue(SENT_INVOICE);
});

describe('PATCH invoice immutability', () => {
  it('chipman-silent-mutation-blocked: rejects items change on SENT invoice with 409', async () => {
    const res = await PATCH(
      req({ items: [{ description: 'Reimbursements', quantity: 1, unitPrice: 500.63 }] }),
      { params: { id: 'inv1' } }
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe('INVOICE_IMMUTABLE');
    expect(json.fields).toContain('items');
    expect(invoiceUpdate).not.toHaveBeenCalled();
    expect(invoiceItemDeleteMany).not.toHaveBeenCalled();
  });

  it('rejects a dueDate edit on a SENT invoice', async () => {
    const res = await PATCH(req({ dueDate: '2026-09-30T00:00:00.000Z' }), {
      params: { id: 'inv1' },
    });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.fields).toContain('dueDate');
  });

  it('allows a notes-only edit on a SENT invoice', async () => {
    invoiceUpdate.mockResolvedValue({ ...SENT_INVOICE, notes: 'internal note' });
    const res = await PATCH(req({ notes: 'internal note' }), { params: { id: 'inv1' } });
    expect(res.status).toBe(200);
    expect(invoiceUpdate).toHaveBeenCalledTimes(1);
  });

  it('blocks direct status escalation DRAFT -> SENT via PATCH (must use Send gate)', async () => {
    invoiceFindUnique.mockResolvedValue({
      ...SENT_INVOICE,
      status: 'DRAFT',
      sentAt: null,
    });
    const res = await PATCH(req({ status: 'SENT' }), { params: { id: 'inv1' } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('INVOICE_STATUS_TRANSITION_BLOCKED');
    expect(invoiceUpdate).not.toHaveBeenCalled();
  });
});
