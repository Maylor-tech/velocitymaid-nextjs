import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const { role, refresh, send } = vi.hoisted(() => ({ role: vi.fn(), refresh: vi.fn(), send: vi.fn() }));
vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: role,
  assertSuperAdmin: (auth: { branchId?: string }) => {
    if (auth.branchId) throw NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  },
}));
vi.mock('@/lib/invoices/invoiceService', () => ({ refreshInvoiceStatus: refresh }));
vi.mock('@/lib/invoices/sendReminder', () => ({ sendRecordedInvoiceReminder: send }));
import { POST } from '../[id]/remind/route';
const request = () => new NextRequest('http://localhost/api/admin/invoices/fictional/remind', { method: 'POST' });
const context = { params: { id: 'fictional' } };
describe('manual invoice reminder authorization and outcomes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    role.mockResolvedValue({ userId: 'owner', role: 'ADMIN' });
    send.mockResolvedValue({ sent: true, messageId: 'mock-message' });
  });
  it('denies branch-scoped operators before reading or sending billing data', async () => {
    role.mockResolvedValue({ userId: 'operator', branchId: 'fictional-branch' });
    expect((await POST(request(), context)).status).toBe(403);
    expect(refresh).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it('denies unauthenticated requests', async () => {
    role.mockRejectedValue(new NextResponse('Unauthorized', { status: 401 }));
    expect((await POST(request(), context)).status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });
  it.each([
    [{ sent: true, messageId: 'mock-message' }, 200],
    [{ sent: false, failed: true, deliveryUnknown: true }, 502],
    [{ sent: false, skippedReason: 'recipient cooldown' }, 409],
  ])('reports the actual sender outcome %j', async (result, status) => {
    send.mockResolvedValue(result);
    const response = await POST(request(), context);
    expect(response.status).toBe(status);
    expect((await response.json()).success).toBe(result.sent);
  });
});
