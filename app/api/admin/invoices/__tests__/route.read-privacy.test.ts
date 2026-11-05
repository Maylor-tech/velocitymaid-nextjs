import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn(), aggregate: vi.fn(), count: vi.fn(), serialize: vi.fn() }));
vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: mocks.auth,
  assertOwnerAuthorization: (auth: { isOwner?: boolean }) => {
    if (auth?.isOwner !== true) {
      throw NextResponse.json(
        { success: false, error: 'Forbidden: Owner authorization required' },
        { status: 403 }
      );
    }
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: { invoice: { findMany: mocks.findMany, aggregate: mocks.aggregate, count: mocks.count } } }));
vi.mock('@/lib/invoices/invoiceService', () => ({ buildInvoiceAmounts: vi.fn(), mapItemsForCreate: vi.fn() }));
vi.mock('@/lib/invoices/invoiceUtils', () => ({ nextInvoiceNumber: vi.fn(), decimalToNumber: (v: unknown) => Number(v) }));
vi.mock('@/lib/invoices/serializeInvoice', () => ({ serializeInvoice: mocks.serialize }));
import { GET } from '../route';

const request = () => new NextRequest('https://preview.example.test/api/admin/invoices?q=FICTIONAL-NO-MATCH');
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ role: 'ADMIN', isOwner: true }); mocks.serialize.mockImplementation((v: unknown) => v); });

describe('invoice list error privacy', () => {
  it('passes each invoice alone to the serializer without the array index as options', async () => {
    const invoices = [{ id: 'fictional-invoice-1' }, { id: 'fictional-invoice-2' }];
    mocks.findMany.mockResolvedValueOnce(invoices).mockResolvedValueOnce([]);
    mocks.aggregate.mockResolvedValue({ _sum: { total: null } });
    mocks.count.mockResolvedValue(0);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(mocks.serialize).toHaveBeenNthCalledWith(1, invoices[0]);
    expect(mocks.serialize).toHaveBeenNthCalledWith(2, invoices[1]);
  });
  it('returns only a fixed message for an unexpected database denial', async () => {
    mocks.findMany.mockRejectedValue(new Error('SQLSTATE 42501; permission denied for table Invoice; postgresql://fictional:FICTIONAL_SECRET@db.invalid/postgres'));
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: 'Failed to list invoices' });
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.aggregate).not.toHaveBeenCalled();
    expect(mocks.count).not.toHaveBeenCalled();
  });
  it('preserves an explicit authorization response before any database access', async () => {
    const denied = NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    mocks.auth.mockRejectedValue(denied);
    const response = await GET(request());
    expect(response).toBe(denied);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
