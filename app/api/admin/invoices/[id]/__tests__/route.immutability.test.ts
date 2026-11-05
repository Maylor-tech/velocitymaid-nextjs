/**
 * Incident #001 — PATCH immutability at the route boundary.
 * Proves a SENT invoice cannot be financially mutated (chipman-silent-mutation-blocked).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const requireRole = vi.fn();
const invoiceFindUnique = vi.fn();
const invoiceUpdate = vi.fn();
const invoiceItemDeleteMany = vi.fn();
const invoiceItemCreateMany = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
  assertOwnerAuthorization: (auth: { isOwner?: boolean }) => {
    if (auth?.isOwner !== true) {
      throw NextResponse.json(
        { success: false, error: 'Forbidden: Owner authorization required' },
        { status: 403 }
      );
    }
  },
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

import { NextResponse } from 'next/server';

import { GET, PATCH } from '@/app/api/admin/invoices/[id]/route';

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
  requireRole.mockResolvedValue({ userId: 'admin1', role: 'ADMIN', isOwner: true });
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


describe('invoice error privacy', () => {
  const context = { params: { id: 'inv1' } };

  it.each([
    ['GET', GET, 'Failed to fetch invoice'],
    ['PATCH', PATCH, 'Failed to update invoice'],
  ] as const)('%s hides unexpected database error details', async (_method, handler, message) => {
    invoiceFindUnique.mockRejectedValueOnce(new Error(
      'permission denied for table Invoice; SQLSTATE 42501; postgres://fixture:secret@db.invalid/postgres'
    ));
    const response = await handler(req({ notes: 'test' }), context);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: message });
  });

  it.each([GET, PATCH])('preserves explicit authorization responses', async (handler) => {
    const denied = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    requireRole.mockRejectedValueOnce(denied);
    const response = await handler(req({}), context);
    expect(response).toBe(denied);
    expect(invoiceFindUnique).not.toHaveBeenCalled();
  });
});
