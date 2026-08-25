/**
 * Incident #001 — manual invoice creation cannot issue/send in one ungated step.
 *
 * Invoice 0017 (the $500.63 manual artifact) originated from an out-of-gate
 * create-and-send. This proves the create route now always persists a DRAFT
 * (never SENT, never sentAt) regardless of the legacy `markSent` flag, so the
 * only way to issue is the gated /[id]/send endpoint.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireRole = vi.fn();
const invoiceCreate = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      create: (...a: unknown[]) => invoiceCreate(...a),
    },
  },
}));

vi.mock('@/lib/invoices/invoiceService', () => ({
  buildInvoiceAmounts: () => ({ subtotal: 300, total: 300, balanceDue: 300 }),
  mapItemsForCreate: (items: unknown[]) => items,
}));

vi.mock('@/lib/invoices/invoiceUtils', () => ({
  nextInvoiceNumber: async () => 'VM-2026-0099',
  decimalToNumber: (v: unknown) => Number(v ?? 0),
}));

vi.mock('@/lib/invoices/serializeInvoice', () => ({
  serializeInvoice: (inv: unknown) => inv,
}));

import { POST } from '@/app/api/admin/invoices/route';

function req(body: unknown) {
  return { json: async () => body } as never;
}

const VALID_BODY = {
  clientName: 'Chris Ray Hautchamp',
  propertyAddress: '198 Chipman Park, Middlebury, VT 05753',
  serviceType: 'Turnover clean',
  items: [{ description: 'Turnover clean', quantity: 1, unitPrice: 300 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  requireRole.mockResolvedValue({ userId: 'admin1', role: 'ADMIN' });
  invoiceCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'new1',
    invoiceNumber: 'VM-2026-0099',
    ...data,
  }));
});

describe('POST create invoice — no ungated send', () => {
  it('creates a DRAFT even when markSent=true (issuing must use the send gate)', async () => {
    const res = await POST(req({ ...VALID_BODY, markSent: true }));
    expect(res.status).toBe(200);
    expect(invoiceCreate).toHaveBeenCalledTimes(1);
    const arg = invoiceCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(arg.data.status).toBe('DRAFT');
    expect(arg.data.sentAt).toBeNull();
  });

  it('creates a DRAFT for a normal save-draft request', async () => {
    const res = await POST(req({ ...VALID_BODY }));
    expect(res.status).toBe(200);
    const arg = invoiceCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(arg.data.status).toBe('DRAFT');
    expect(arg.data.sentAt).toBeNull();
  });
});
