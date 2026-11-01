import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { assertBillingFixture } from '../../../scripts/billing-postgres-fixture.mjs';

const state = vi.hoisted(() => ({ client: null as PrismaClient | null, send: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  get prisma() {
    if (!state.client) throw new Error('Disposable database not initialized');
    return state.client;
  },
}));
// Never load an actual mail client in this database suite.
vi.mock('@/lib/email/invoiceEmails', () => ({ sendInvoiceReminderEmail: state.send }));
import { sendRecordedInvoiceReminder } from '../sendReminder';

describe.runIf(process.env.RUN_BILLING_POSTGRES_TESTS === '1')('disposable PostgreSQL reminder verification', () => {
  let db: PrismaClient;
  const now = new Date('2026-10-31T15:00:00Z');
  const options = { triggeredBy: 'cron' as const, stage: 'due_today', now };

  beforeAll(async () => {
    const url = assertBillingFixture();
    db = new PrismaClient({ datasources: { db: { url } } });
    state.client = db;
    await db.$connect();
    await db.$executeRawUnsafe('CREATE ROLE vm_billing_anon NOLOGIN');
    await db.$executeRawUnsafe('CREATE ROLE vm_billing_authenticated NOLOGIN');
    await db.$executeRawUnsafe('CREATE ROLE vm_billing_server NOLOGIN BYPASSRLS');
    await db.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO vm_billing_anon, vm_billing_authenticated, vm_billing_server');
    await db.$executeRawUnsafe('GRANT SELECT, INSERT, UPDATE, DELETE ON "InvoiceReminderDelivery" TO vm_billing_anon, vm_billing_authenticated, vm_billing_server');
  }, 30_000);
  beforeEach(async () => {
    state.send.mockReset();
    state.send.mockResolvedValue({ sent: true, messageId: 'mock-provider-accepted' });
    await db.invoiceReminderDelivery.deleteMany({ where: { invoiceId: { startsWith: 'pg-test-' } } });
    await db.invoice.deleteMany({ where: { id: { startsWith: 'pg-test-' } } });
  });
  afterAll(async () => { if (db) await db.$disconnect(); state.client = null; });

  const seed = (suffix: string, email = 'billing-fixture@example.invalid') => db.invoice.create({ data: {
    id: `pg-test-${suffix}`, invoiceNumber: `PG-TEST-${suffix}`, clientName: 'Fictional PostgreSQL Fixture',
    clientEmail: email, propertyAddress: 'DEMO-PG-001', serviceType: 'Fixture only',
    dueDate: new Date('2026-10-31'), subtotal: 100, total: 100, balanceDue: 100, status: 'SENT',
    sentAt: new Date('2026-10-30T15:00:00Z'),
  } });

  it('applies RLS and blocks public/authenticated reads and writes', async () => {
    const invoice = await seed('rls');
    await db.invoiceReminderDelivery.create({ data: { invoiceId: invoice.id, stage: 'fixture', recipientEmail: 'rls@example.invalid', contactDate: '2026-10-31' } });
    const flags = await db.$queryRaw<{ relrowsecurity: boolean }[]>`SELECT relrowsecurity FROM pg_class WHERE oid = 'public."InvoiceReminderDelivery"'::regclass`;
    expect(flags[0].relrowsecurity).toBe(true);
    for (const role of ['vm_billing_anon', 'vm_billing_authenticated'] as const) {
      const rows = await db.$transaction(async (tx) => {
        // Role comes only from the fixed test tuple, never a user value.
        await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
        return tx.invoiceReminderDelivery.findMany();
      });
      expect(rows).toEqual([]);
      await expect(db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
        return tx.invoiceReminderDelivery.create({ data: { invoiceId: invoice.id, stage: role, recipientEmail: `${role}@example.invalid`, contactDate: '2026-10-31' } });
      })).rejects.toThrow();
    }
    const serverRows = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE vm_billing_server');
      return tx.invoiceReminderDelivery.findMany();
    });
    expect(serverRows).toHaveLength(1);
  });

  it('enforces both unique claims and the invoice foreign key', async () => {
    const a = await seed('constraints-a'); const b = await seed('constraints-b');
    const entry = { invoiceId: a.id, stage: 'due_today', recipientEmail: 'constraint@example.invalid', contactDate: '2026-10-31' };
    await db.invoiceReminderDelivery.create({ data: entry });
    await expect(db.invoiceReminderDelivery.create({ data: { ...entry, recipientEmail: 'different@example.invalid' } })).rejects.toMatchObject({ code: 'P2002' });
    await expect(db.invoiceReminderDelivery.create({ data: { ...entry, invoiceId: b.id } })).rejects.toMatchObject({ code: 'P2002' });
    await expect(db.invoiceReminderDelivery.create({ data: { ...entry, invoiceId: 'pg-test-missing', recipientEmail: 'orphan@example.invalid' } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('allows one provider call across competing manual and cron sends', async () => {
    const invoice = await seed('race');
    state.send.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { sent: true, messageId: 'mock-race-accepted' };
    });
    const results = await Promise.all(Array.from({ length: 6 }, (_, index) => sendRecordedInvoiceReminder(invoice.id,
      index % 2 ? { ...options, triggeredBy: 'admin', stage: undefined } : options)));
    expect(state.send).toHaveBeenCalledTimes(1);
    expect(results.filter((result) => result.sent)).toHaveLength(1);
    expect(await db.invoiceReminderDelivery.count({ where: { invoiceId: invoice.id } })).toBe(1);
  }, 30_000);

  it('serializes different invoices sharing a case-insensitive recipient', async () => {
    const a = await seed('recipient-a', 'Shared@example.invalid'); const b = await seed('recipient-b', 'shared@example.invalid');
    const results = await Promise.all([sendRecordedInvoiceReminder(a.id, options), sendRecordedInvoiceReminder(b.id, options)]);
    expect(state.send).toHaveBeenCalledTimes(1);
    expect(results.filter((result) => result.sent)).toHaveLength(1);
  });

  it('never sends paid, cancelled or paused fixtures', async () => {
    const invoice = await seed('paused');
    for (const update of [{ remindersPaused: true }, { remindersPaused: false, status: 'PAID' as const, balanceDue: 0 }, { status: 'CANCELLED' as const, balanceDue: 100 }]) {
      await db.invoice.update({ where: { id: invoice.id }, data: update });
      expect((await sendRecordedInvoiceReminder(invoice.id, options)).sent).toBe(false);
    }
    expect(state.send).not.toHaveBeenCalled();
  });

  it('holds ambiguous provider outcomes without another provider call', async () => {
    const invoice = await seed('unknown');
    state.send.mockResolvedValue({ sent: false, deliveryUnknown: true, error: 'mock timeout' });
    await sendRecordedInvoiceReminder(invoice.id, options);
    const result = await sendRecordedInvoiceReminder(invoice.id, { ...options, stage: 'overdue_1', now: new Date('2026-11-02T15:00:00Z') });
    expect(result.sent).toBe(false);
    expect(state.send).toHaveBeenCalledTimes(1);
    expect((await db.invoiceReminderDelivery.findFirst({ where: { invoiceId: invoice.id } }))?.status).toBe('UNKNOWN');
  });

  it('uses the actual remaining invoice balance after partial payment', async () => {
    const invoice = await seed('partial');
    await db.invoice.update({ where: { id: invoice.id }, data: { amountPaid: 75, balanceDue: 25, status: 'PARTIALLY_PAID' } });
    expect((await sendRecordedInvoiceReminder(invoice.id, options)).sent).toBe(true);
    expect(state.send.mock.calls[0][0].balanceDue).toBe(25);
  });
});
