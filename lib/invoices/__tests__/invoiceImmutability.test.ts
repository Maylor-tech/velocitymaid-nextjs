import { describe, expect, it } from 'vitest';
import {
  isAccountingLocked,
  lockedFieldsTouchedBy,
  assertInvoiceDraftEditable,
  InvoiceImmutableError,
  type ExistingInvoiceValues,
  type LockableInvoice,
} from '@/lib/invoices/invoiceImmutability';

const existing: LockableInvoice & ExistingInvoiceValues = {
  status: 'SENT',
  sentAt: new Date('2026-08-23T12:00:00.000Z'),
  clientName: 'Chris Ray Hautchamp',
  clientEmail: 'hautchamp26@gmail.com',
  propertyAddress: '198 Chipman Park, Middlebury, VT 05753',
  serviceType: 'Turnover clean',
  jobDate: new Date('2026-08-23T00:00:00.000Z'),
  dueDate: new Date('2026-08-30T00:00:00.000Z'),
  tax: 0,
  discount: 0,
};

describe('isAccountingLocked', () => {
  it('locks issued statuses', () => {
    for (const status of ['SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as const) {
      expect(isAccountingLocked({ status, sentAt: null })).toBe(true);
    }
  });

  it('does not lock DRAFT', () => {
    expect(isAccountingLocked({ status: 'DRAFT', sentAt: null })).toBe(false);
  });

  it('locks a DRAFT that carries sentAt (legacy belt-and-suspenders)', () => {
    expect(isAccountingLocked({ status: 'DRAFT', sentAt: new Date() })).toBe(true);
  });
});

describe('lockedFieldsTouchedBy', () => {
  it('detects an items replacement as a financial edit', () => {
    expect(lockedFieldsTouchedBy(existing, { items: [{ description: 'x' }] })).toContain('items');
  });

  it('detects a dueDate change (correction #3)', () => {
    expect(
      lockedFieldsTouchedBy(existing, { dueDate: '2026-09-15T00:00:00.000Z' })
    ).toContain('dueDate');
  });

  it('ignores a resubmitted unchanged dueDate (no false positive)', () => {
    expect(
      lockedFieldsTouchedBy(existing, { dueDate: '2026-08-30T00:00:00.000Z' })
    ).toEqual([]);
  });

  it('ignores unchanged identity fields but flags real changes', () => {
    expect(lockedFieldsTouchedBy(existing, { clientName: 'Chris Ray Hautchamp' })).toEqual([]);
    expect(lockedFieldsTouchedBy(existing, { clientName: 'Someone Else' })).toContain('clientName');
  });

  it('flags a status change but not a status echo', () => {
    expect(lockedFieldsTouchedBy(existing, { status: 'SENT' })).toEqual([]);
    expect(lockedFieldsTouchedBy(existing, { status: 'DRAFT' })).toContain('status');
  });

  it('flags tax/discount changes numerically', () => {
    expect(lockedFieldsTouchedBy(existing, { tax: 0 })).toEqual([]);
    expect(lockedFieldsTouchedBy(existing, { tax: 5 })).toContain('tax');
  });
});

describe('assertInvoiceDraftEditable', () => {
  it('allows edits on a DRAFT invoice', () => {
    const draft = { ...existing, status: 'DRAFT' as const, sentAt: null };
    expect(() => assertInvoiceDraftEditable(draft, { items: [{}], total: 500 } as never)).not.toThrow();
  });

  it('allows notes-only edit on a locked invoice', () => {
    expect(() => assertInvoiceDraftEditable(existing, {} as never)).not.toThrow();
  });

  it('throws InvoiceImmutableError when a locked field changes', () => {
    try {
      assertInvoiceDraftEditable(existing, { items: [{ description: 'keys' }] } as never);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(InvoiceImmutableError);
      expect((e as InvoiceImmutableError).code).toBe('INVOICE_IMMUTABLE');
      expect((e as InvoiceImmutableError).fields).toContain('items');
    }
  });
});
