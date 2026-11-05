import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const { findMany, send, auth } = vi.hoisted(() => ({ findMany: vi.fn(), send: vi.fn(), auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { invoice: { findMany } } }));
vi.mock('@/lib/cron/verifyCronAuth', () => ({ verifyCronAuth: auth }));
vi.mock('@/lib/invoices/sendReminder', () => ({
  REMINDABLE_STATUSES: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'], sendRecordedInvoiceReminder: send,
}));
import { GET } from '../invoice-reminders/route';
const request = () => new Request('http://localhost/api/cron/invoice-reminders') as never;
describe('invoice reminder scheduling', () => {
  beforeEach(() => {
    vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-31T15:00:00Z'));
    vi.stubEnv('INVOICE_REMINDER_STAGES_ENABLED', 'false');
    auth.mockReturnValue(null); findMany.mockResolvedValue([]); send.mockResolvedValue({ sent: true });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
  it('rejects unauthorized callers without querying invoices', async () => {
    auth.mockReturnValue(new Response('unauthorized', { status: 401 }));
    expect((await GET(request())).status).toBe(401); expect(findMany).not.toHaveBeenCalled();
  });
  it('does not run outside the customer send window', async () => {
    vi.setSystemTime(new Date('2026-10-31T09:00:00Z'));
    const body = await (await GET(request())).json();
    expect(body.skipped).toContain('send window'); expect(findMany).not.toHaveBeenCalled();
  });
  it('retains the old overdue-only policy unless expanded stages are explicitly enabled', async () => {
    findMany.mockResolvedValue([{ id: 'i1', dueDate: new Date('2026-10-20') }]);
    const body = await (await GET(request())).json();
    expect(body.expanded).toBe(false);
    expect(findMany.mock.calls[0][0].where).toMatchObject({ reminderSentAt: null, remindersPaused: false, balanceDue: { gt: 0 } });
    expect(send).toHaveBeenCalledWith('i1', expect.objectContaining({ stage: 'legacy_overdue' }));
  });
  it('uses the shared branded sender for due-soon, due-today and overdue stages', async () => {
    vi.stubEnv('INVOICE_REMINDER_STAGES_ENABLED', 'true');
    findMany.mockResolvedValue([
      { id: 'a', dueDate: new Date('2026-11-01') }, { id: 'b', dueDate: new Date('2026-10-31') },
      { id: 'c', dueDate: new Date('2026-10-30') }, { id: 'd', dueDate: new Date('2026-10-24') },
    ]);
    expect((await (await GET(request())).json()).sent).toBe(4);
    expect(send.mock.calls.map(([, options]) => options.stage)).toEqual(['due_soon', 'due_today', 'overdue_1', 'overdue_7']);
  });
  it('reports failed and suppressed attempts without claiming they were sent', async () => {
    findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    send.mockResolvedValueOnce({ sent: false, failed: true }).mockResolvedValueOnce({ sent: false, skippedReason: 'cooldown' });
    expect(await (await GET(request())).json()).toMatchObject({ sent: 0, failed: 1, skipped: 1 });
  });
});
