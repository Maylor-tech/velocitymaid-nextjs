import { describe, expect, it } from 'vitest';
import {
  evaluateInvoiceSendable,
  INVOICE_SEND_ERRORS,
  INVOICE_SEND_WARNINGS,
  type EvaluableInvoice,
  type EvaluableJob,
  type EvaluateInvoiceSendableInput,
} from '@/lib/invoices/validateInvoiceSendable';

function baseInvoice(overrides: Partial<EvaluableInvoice> = {}): EvaluableInvoice {
  return {
    id: 'inv1',
    invoiceNumber: 'VM-2026-0022',
    status: 'DRAFT',
    clientEmail: 'hautchamp26@gmail.com',
    clientName: 'Chris Ray Hautchamp',
    customerId: 'cust-chris',
    propertyAddress: '198 Chipman Park, Middlebury, VT 05753',
    jobDate: new Date('2026-08-23T00:00:00.000Z'),
    subtotal: 300,
    tax: 0,
    discount: 0,
    total: 300,
    items: [{ lineTotal: 300 }],
    ...overrides,
  };
}

function baseJob(overrides: Partial<EvaluableJob> = {}): EvaluableJob {
  return {
    id: 'job1',
    address: '198 Chipman Park, Middlebury, VT 05753',
    preferredDate: new Date('2026-08-23T00:00:00.000Z'),
    totalPrice: 300,
    quotedTotal: 300,
    customerId: 'cust-chris',
    customerEmail: 'hautchamp26@gmail.com',
    customerName: 'Chris Ray Hautchamp',
    ...overrides,
  };
}

function input(overrides: Partial<EvaluateInvoiceSendableInput> = {}): EvaluateInvoiceSendableInput {
  return {
    invoice: baseInvoice(),
    job: baseJob(),
    siblings: [],
    invoiceNumberConflict: false,
    options: { reimbursementsConfirmed: true },
    ...overrides,
  };
}

function codes(result: { ok: boolean }): string[] {
  const r = result as { errors?: { code: string }[]; warnings?: { code: string }[] };
  return [...(r.errors ?? []), ...(r.warnings ?? [])].map((f) => f.code);
}

describe('evaluateInvoiceSendable — happy path', () => {
  it('passes a clean, confirmed DRAFT', () => {
    const r = evaluateInvoiceSendable(input());
    expect(r.ok).toBe(true);
  });
});

describe('errors (never overridable)', () => {
  it('C1 — missing invoice', () => {
    const r = evaluateInvoiceSendable(input({ invoice: null }));
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.NOT_FOUND);
  });

  it('C2 — not DRAFT (idempotency at validation)', () => {
    const r = evaluateInvoiceSendable(input({ invoice: baseInvoice({ status: 'SENT' }) }));
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.NOT_DRAFT);
  });

  it('C3 — no line items', () => {
    const r = evaluateInvoiceSendable(input({ invoice: baseInvoice({ items: [] }) }));
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.NO_LINE_ITEMS);
  });

  it('C4 — arithmetic mismatch, and cannot be acknowledged away', () => {
    const bad = baseInvoice({ items: [{ lineTotal: 337.8 }], subtotal: 300, total: 300 });
    const r = evaluateInvoiceSendable(
      input({
        invoice: bad,
        options: {
          reimbursementsConfirmed: true,
          // Attempt to override the arithmetic error — must be ignored.
          acknowledgeWarnings: [INVOICE_SEND_ERRORS.TOTAL_MISMATCH],
        },
      })
    );
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.TOTAL_MISMATCH);
  });

  it('C5 — missing client email', () => {
    const r = evaluateInvoiceSendable(input({ invoice: baseInvoice({ clientEmail: null }) }));
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.NO_CLIENT_EMAIL);
  });

  it('C6 — property mismatch with job', () => {
    const r = evaluateInvoiceSendable(input({ job: baseJob({ address: '1 Other St' }) }));
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.JOB_PROPERTY_MISMATCH);
  });

  it('C6b — customer identity mismatch', () => {
    const r = evaluateInvoiceSendable(
      input({ job: baseJob({ customerId: 'someone-else', customerEmail: 'other@x.com' }) })
    );
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.CUSTOMER_MISMATCH);
  });

  it('C6b — falls back to email when customerId absent on one side', () => {
    const r = evaluateInvoiceSendable(
      input({
        invoice: baseInvoice({ customerId: null }),
        job: baseJob({ customerId: null }),
      })
    );
    expect(codes(r)).not.toContain(INVOICE_SEND_ERRORS.CUSTOMER_MISMATCH);
  });

  it('C9 — duplicate issued invoice for same customer+property+service date', () => {
    const r = evaluateInvoiceSendable(
      input({
        siblings: [
          { id: 'inv-old', status: 'SENT', jobDate: new Date('2026-08-23T00:00:00.000Z'), sentAt: new Date() },
        ],
      })
    );
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.DUPLICATE_SERVICE);
  });

  it('C8a — invoice number conflict', () => {
    const r = evaluateInvoiceSendable(input({ invoiceNumberConflict: true }));
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.NUMBER_CONFLICT);
  });
});

describe('C7 — timezone-safe service date', () => {
  it('does NOT fail when two evening timestamps share a VT day but differ by UTC day', () => {
    // 2026-08-23 20:00 VT == 2026-08-24T00:00Z; 2026-08-23 23:30 VT == 2026-08-24T03:30Z.
    // Same Vermont calendar day (Aug 23), different UTC day (Aug 24).
    const r = evaluateInvoiceSendable(
      input({
        invoice: baseInvoice({ jobDate: new Date('2026-08-24T00:00:00.001Z') }),
        job: baseJob({ preferredDate: new Date('2026-08-24T03:30:00.000Z') }),
      })
    );
    expect(codes(r)).not.toContain(INVOICE_SEND_ERRORS.JOB_DATE_MISMATCH);
  });

  it('fails when the service dates are genuinely different days', () => {
    const r = evaluateInvoiceSendable(
      input({ job: baseJob({ preferredDate: new Date('2026-08-20T00:00:00.000Z') }) })
    );
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.JOB_DATE_MISMATCH);
  });
});

describe('warnings — scoped acknowledgement', () => {
  it('C8 job-total mismatch is a warning, blocking until acknowledged', () => {
    const invoice = baseInvoice({ items: [{ lineTotal: 500.63 }], subtotal: 500.63, total: 500.63 });
    const job = baseJob({ totalPrice: 300, quotedTotal: 300 });

    const blocked = evaluateInvoiceSendable(
      input({ invoice, job, options: { reimbursementsConfirmed: true } })
    );
    expect(blocked.ok).toBe(false);
    expect(codes(blocked)).toContain(INVOICE_SEND_WARNINGS.JOB_TOTAL_MISMATCH);

    const acked = evaluateInvoiceSendable(
      input({
        invoice,
        job,
        options: {
          reimbursementsConfirmed: true,
          acknowledgeWarnings: [INVOICE_SEND_WARNINGS.JOB_TOTAL_MISMATCH],
        },
      })
    );
    expect(acked.ok).toBe(true);
  });

  it('C10 recent-send to a DIFFERENT service date is a warning, not a hard fail', () => {
    const r = evaluateInvoiceSendable(
      input({
        siblings: [
          { id: 'inv-old', status: 'SENT', jobDate: new Date('2026-08-20T00:00:00.000Z'), sentAt: new Date() },
        ],
      })
    );
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain(INVOICE_SEND_WARNINGS.RECENT_SEND_CONFLICT);
    expect(codes(r)).not.toContain(INVOICE_SEND_ERRORS.DUPLICATE_SERVICE);
  });
});

describe('Incident #001 regression — mandatory', () => {
  it('chipman-0022-unresolved-reimbursement-blocked', () => {
    // Job $300, invoice $300, turnover only, reimbursement unresolved (no confirmation).
    const r = evaluateInvoiceSendable(
      input({ options: {} }) // reimbursementsConfirmed omitted
    );
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain(INVOICE_SEND_ERRORS.REIMBURSEMENTS_UNCONFIRMED);
  });

  it('does not falsely block once reimbursements are confirmed', () => {
    const r = evaluateInvoiceSendable(input({ options: { reimbursementsConfirmed: true } }));
    expect(r.ok).toBe(true);
  });
});
