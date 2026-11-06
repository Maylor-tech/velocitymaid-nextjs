import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
const { db, send, serialize } = vi.hoisted(() => {
  const db = {
    invoice: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    invoiceReminderDelivery: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(), $executeRaw: vi.fn(),
  };
  return { db, send: vi.fn(), serialize: vi.fn() };
});
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/email/invoiceEmails', () => ({ sendInvoiceReminderEmail: send }));
vi.mock('../serializeInvoice', () => ({ serializeInvoice: serialize }));
import { sendRecordedInvoiceReminder } from '../sendReminder';
const invoice = { id: 'i1', status: 'SENT', remindersPaused: false, clientEmail: 'Client@Example.com', balanceDue: 100 };
const options = { triggeredBy: 'cron' as const, stage: 'due_today', now: new Date('2026-10-31T15:00:00Z') };

describe('shared invoice reminder delivery ledger', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('INVOICE_REMINDER_SENDING_ENABLED', 'true');
    db.$transaction.mockImplementation(async (arg) => typeof arg === 'function' ? arg(db) : Promise.all(arg));
    db.invoice.findUnique.mockResolvedValue(invoice);
    db.invoice.findFirst.mockResolvedValue(null);
    db.invoiceReminderDelivery.findFirst.mockResolvedValue(null);
    db.invoiceReminderDelivery.findUnique.mockResolvedValue(null);
    db.invoiceReminderDelivery.create.mockResolvedValue({ id: 'delivery1' });
    db.invoiceReminderDelivery.update.mockResolvedValue({});
    db.invoice.update.mockResolvedValue({});
    serialize.mockReturnValue({ ...invoice, balanceDue: 100 });
    send.mockResolvedValue({ sent: true, messageId: 'provider1' });
  });
  it.each(['PAID', 'CANCELLED', 'DRAFT'])('never sends %s invoices', async (status) => {
    db.invoice.findUnique.mockResolvedValue({ ...invoice, status });
    expect((await sendRecordedInvoiceReminder('i1', options)).sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
  it('honors a pause for disputes or pending manual transfers', async () => {
    db.invoice.findUnique.mockResolvedValue({ ...invoice, remindersPaused: true });
    await sendRecordedInvoiceReminder('i1', options);
    expect(send).not.toHaveBeenCalled();
  });
  it('checks a recipient-level cooldown across different invoices and channels', async () => {
    db.invoiceReminderDelivery.findFirst.mockResolvedValue({ status: 'EXTERNAL' });
    await sendRecordedInvoiceReminder('i1', options);
    expect(send).not.toHaveBeenCalled();
    expect(db.invoiceReminderDelivery.create).not.toHaveBeenCalled();
  });
  it('skips a previously recorded stage, including uncertain outcomes', async () => {
    db.invoiceReminderDelivery.findUnique.mockResolvedValue({ status: 'UNKNOWN' });
    await sendRecordedInvoiceReminder('i1', options);
    expect(send).not.toHaveBeenCalled();
  });
  it('losing a unique stage/day claim never sends', async () => {
    db.invoiceReminderDelivery.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' }));
    await sendRecordedInvoiceReminder('i1', options);
    expect(send).not.toHaveBeenCalled();
  });
  it('rechecks payment after claiming and before calling the provider', async () => {
    db.invoice.findUnique.mockResolvedValueOnce(invoice).mockResolvedValueOnce({ ...invoice, status: 'PAID', balanceDue: 0 });
    await sendRecordedInvoiceReminder('i1', options);
    expect(send).not.toHaveBeenCalled();
    expect(db.invoiceReminderDelivery.update).toHaveBeenCalledWith({ where: { id: 'delivery1' }, data: { status: 'SKIPPED' } });
  });
  it('sends only the current remaining balance after partial payment', async () => {
    serialize.mockReturnValue({ ...invoice, status: 'PARTIALLY_PAID', balanceDue: 25 });
    const result = await sendRecordedInvoiceReminder('i1', options);
    expect(result).toEqual({ sent: true, messageId: 'provider1' });
    expect(send.mock.calls[0][0].balanceDue).toBe(25);
    expect(send.mock.calls[0][1].idempotencyKey).toMatch(/^invoice-reminder-/);
    expect(db.invoice.update).toHaveBeenCalledWith({ where: { id: 'i1' }, data: { reminderSentAt: options.now } });
  });
  it('stores definitive failure without updating the successful-send timestamp', async () => {
    send.mockResolvedValue({ sent: false, error: 'rejected', deliveryUnknown: false });
    expect((await sendRecordedInvoiceReminder('i1', options)).failed).toBe(true);
    expect(db.invoiceReminderDelivery.update).toHaveBeenCalledWith({ where: { id: 'delivery1' }, data: { status: 'FAILED', errorSummary: 'rejected' } });
    expect(db.invoice.update).not.toHaveBeenCalled();
  });
  it('holds unknown delivery for reconciliation instead of releasing it', async () => {
    send.mockResolvedValue({ sent: false, error: 'timeout', deliveryUnknown: true });
    await sendRecordedInvoiceReminder('i1', options);
    expect(db.invoiceReminderDelivery.update).toHaveBeenCalledWith({ where: { id: 'delivery1' }, data: { status: 'UNKNOWN', errorSummary: 'timeout' } });
  });
  it('does not release an accepted send if its post-send transaction fails', async () => {
    db.$transaction.mockImplementationOnce(async (fn) => fn(db)).mockRejectedValueOnce(new Error('database unavailable'));
    await expect(sendRecordedInvoiceReminder('i1', options)).rejects.toThrow('database unavailable');
    expect(db.invoiceReminderDelivery.update.mock.calls.some(([args]) => args.data.status === 'FAILED')).toBe(false);
  });
  it.each([
    { ...invoice, remindersPaused: true },
    { ...invoice, clientEmail: 'changed@example.com' },
  ])('does not send when pause or recipient changes after the claim', async (changed) => {
    db.invoice.findUnique.mockResolvedValueOnce(invoice).mockResolvedValueOnce(changed);
    expect((await sendRecordedInvoiceReminder('i1', options)).sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(db.invoiceReminderDelivery.update).toHaveBeenCalledWith({ where: { id: 'delivery1' }, data: { status: 'SKIPPED' } });
  });
});

describe('invoice reminder sending hold', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    delete process.env.INVOICE_REMINDER_SENDING_ENABLED;
    db.$transaction.mockImplementation(async (arg) => typeof arg === 'function' ? arg(db) : Promise.all(arg));
    db.invoice.findUnique.mockResolvedValue(invoice);
    send.mockResolvedValue({ sent: true, messageId: 'provider1' });
  });

  it.each([
    ['unset', undefined],
    ['false', 'false'],
    ['TRUE', 'TRUE'],
    ['1', '1'],
  ])('stays disabled when the flag is %s', async (_label, value) => {
    if (value !== undefined) vi.stubEnv('INVOICE_REMINDER_SENDING_ENABLED', value);
    const result = await sendRecordedInvoiceReminder('i1', options);
    expect(result).toEqual({
      sent: false,
      disabled: true,
      skippedReason: 'Invoice reminder sending is disabled. No email was sent.',
    });
    expect(send).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.invoiceReminderDelivery.create).not.toHaveBeenCalled();
    expect(db.invoiceReminderDelivery.update).not.toHaveBeenCalled();
    expect(db.invoice.update).not.toHaveBeenCalled();
  });

  it.each([
    { triggeredBy: 'cron' as const, stage: 'legacy_overdue' },
    { triggeredBy: 'cron' as const, stage: 'due_soon' },
    { triggeredBy: 'cron' as const, stage: 'due_today' },
    { triggeredBy: 'cron' as const, stage: 'overdue_1' },
    { triggeredBy: 'cron' as const, stage: 'overdue_7' },
    { triggeredBy: 'admin' as const },
  ])('covers %j without a provider call', async (heldOptions) => {
    const result = await sendRecordedInvoiceReminder('i1', heldOptions);
    expect(result.disabled).toBe(true);
    expect(result.sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(db.invoice.findUnique).not.toHaveBeenCalled();
  });
});
