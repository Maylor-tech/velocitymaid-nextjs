import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvoiceStatus } from '@prisma/client';

const findMany = vi.fn();
const updateMany = vi.fn();
const update = vi.fn();
const sendEmail = vi.fn();
const verifyCronAuth = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: (...a: unknown[]) => findMany(...a),
      updateMany: (...a: unknown[]) => updateMany(...a),
      update: (...a: unknown[]) => update(...a),
    },
  },
}));

vi.mock('@/lib/cron/verifyCronAuth', () => ({
  verifyCronAuth: (...a: unknown[]) => verifyCronAuth(...a),
}));

vi.mock('@/lib/email/cronAutomationEmails', () => ({
  sendInvoiceOverdueReminderEmail: (...a: unknown[]) => sendEmail(...a),
}));

import { GET, __test } from '../invoice-reminders/route';

describe('invoice-reminders cron (FIN-001)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyCronAuth.mockReturnValue(null);
    sendEmail.mockResolvedValue({ sent: true });
    updateMany.mockResolvedValue({ count: 1 });
    update.mockResolvedValue({});
  });

  it('includes SENT, OVERDUE, and PARTIALLY_PAID with balanceDue > 0', () => {
    expect(__test.REMINDABLE_STATUSES).toEqual([
      InvoiceStatus.SENT,
      InvoiceStatus.OVERDUE,
      InvoiceStatus.PARTIALLY_PAID,
    ]);
    const where = __test.buildOverdueWhere(new Date('2026-01-01'));
    expect(where).toMatchObject({
      status: { in: __test.REMINDABLE_STATUSES },
      reminderSentAt: null,
      balanceDue: { gt: 0 },
    });
  });

  it('claims reminderSentAt before send and skips when claim lost', async () => {
    findMany.mockResolvedValue([
      {
        id: 'inv-a',
        clientEmail: 'a@example.com',
        clientName: 'A',
        invoiceNumber: 'INV-A',
        balanceDue: 100,
        dueDate: new Date('2025-12-01'),
        serviceType: null,
        jobDate: null,
      },
      {
        id: 'inv-b',
        clientEmail: 'b@example.com',
        clientName: 'B',
        invoiceNumber: 'INV-B',
        balanceDue: 50,
        dueDate: new Date('2025-12-01'),
        serviceType: null,
        jobDate: null,
      },
    ]);
    updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const res = await GET(new Request('http://localhost/api/cron/invoice-reminders') as never);
    const body = await res.json();

    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(body.sent).toBe(1);
    expect(body.skippedClaimed).toBe(1);
  });

  it('releases claim when email send fails so retries remain possible', async () => {
    findMany.mockResolvedValue([
      {
        id: 'inv-fail',
        clientEmail: 'fail@example.com',
        clientName: 'Fail',
        invoiceNumber: 'INV-F',
        balanceDue: 20,
        dueDate: new Date('2025-12-01'),
        serviceType: null,
        jobDate: null,
      },
    ]);
    sendEmail.mockResolvedValue({ sent: false, error: 'resend down' });

    const res = await GET(new Request('http://localhost/api/cron/invoice-reminders') as never);
    const body = await res.json();

    expect(update).toHaveBeenCalledWith({
      where: { id: 'inv-fail' },
      data: { reminderSentAt: null },
    });
    expect(body.failed).toBe(1);
    expect(body.sent).toBe(0);
  });
});
