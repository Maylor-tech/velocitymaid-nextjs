import { beforeEach, describe, expect, it, vi } from 'vitest';
const { db, role, audit } = vi.hoisted(() => ({
  db: { invoice: { findUnique: vi.fn(), update: vi.fn() }, invoiceReminderDelivery: { findUnique: vi.fn(), create: vi.fn() }, $executeRaw: vi.fn(), $transaction: vi.fn() },
  role: vi.fn(), audit: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/audit', () => ({ logAuditEntry: audit }));
vi.mock('@/lib/auth/requireRole', async () => { const { NextResponse } = await import('next/server'); return { requireRole: role, assertSuperAdmin: (auth: { branchId?: string }) => {
  if (auth.branchId) throw new NextResponse('Forbidden', { status: 403 });
} }; });
import { GET, PATCH, POST } from '../[id]/reminders/route';
const context = { params: { id: 'inv-test' } };
const request = (body: object = {}) => new Request('http://localhost/api/admin/invoices/inv-test/reminders', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
}) as never;
describe('admin reminder controls', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    role.mockResolvedValue({ userId: 'owner', role: 'ADMIN' });
    db.invoice.findUnique.mockResolvedValue({ remindersPaused: false, clientEmail: 'client@example.com' });
    db.invoiceReminderDelivery.findUnique.mockResolvedValue(null);
    db.$transaction.mockImplementation(async (fn) => fn(db));
  });
  it('rejects branch-scoped admins before reading billing records', async () => {
    role.mockResolvedValue({ userId: 'branch', branchId: 'b1' });
    expect((await GET(request(), context)).status).toBe(403);
    expect(db.invoice.findUnique).not.toHaveBeenCalled();
  });
  it('validates pause input without changing invoices', async () => {
    expect((await PATCH(request({ paused: 'yes' }), context)).status).toBe(400);
    expect(db.invoice.update).not.toHaveBeenCalled();
  });
  it('pauses reminders and audits the owner without changing service or money', async () => {
    expect((await PATCH(request({ paused: true }), context)).status).toBe(200);
    expect(db.invoice.update).toHaveBeenCalledWith({ where: { id: 'inv-test' }, data: { remindersPaused: true } });
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'owner', action: 'INVOICE_REMINDERS_PAUSE_CHANGED' }));
  });
  it('requires a reference before recording outside contact', async () => {
    expect((await POST(request({ reference: '' }), context)).status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('records external contact without calling any email sender', async () => {
    expect((await POST(request({ reference: 'fictional-message-id' }), context)).status).toBe(200);
    expect(db.invoiceReminderDelivery.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'EXTERNAL', providerMessageId: 'fictional-message-id' }) });
    expect(db.invoice.update).toHaveBeenCalledWith({ where: { id: 'inv-test' }, data: { reminderSentAt: expect.any(Date) } });
  });
  it('allows recording the same external contact on a second invoice without another recipient/day row', async () => {
    db.invoiceReminderDelivery.findUnique.mockResolvedValue({ id: 'existing-contact' });
    expect((await POST(request({ reference: 'same-message-id' }), context)).status).toBe(200);
    expect(db.invoiceReminderDelivery.create).not.toHaveBeenCalled();
    expect(db.invoice.update).toHaveBeenCalled();
  });
});
