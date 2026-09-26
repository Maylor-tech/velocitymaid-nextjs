import { describe, expect, it } from 'vitest';
import {
  buildInvoiceBrandedEmailHtml,
  buildInvoiceBrandedEmailText,
} from '@/lib/email/templates/invoiceBrandedEmail';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { SERVICE_INVOICE_ZELLE_SECONDARY } from '@/lib/tips/zelleDestination';

function baseInvoice(overrides: Partial<SerializedInvoice> = {}): SerializedInvoice {
  return {
    id: 'inv-1',
    invoiceNumber: 'VM-2026-0099',
    publicToken: 'tok-test-99',
    jobId: 'job-1',
    customerId: null,
    clientName: 'Test Client',
    clientEmail: 'client@example.com',
    clientPhone: null,
    propertyAddress: '1 Main St, Burlington, VT',
    serviceType: 'Turnover Clean',
    jobDate: '2026-09-01T00:00:00.000Z',
    jobDateFormatted: 'September 1, 2026',
    dueDate: '2026-09-08T00:00:00.000Z',
    dueDateFormatted: 'September 8, 2026',
    subtotal: 225,
    tax: 0,
    discount: 0,
    total: 225,
    totalFormatted: '$225.00',
    amountPaid: 0,
    amountPaidFormatted: '$0.00',
    balanceDue: 225,
    balanceDueFormatted: '$225.00',
    status: 'SENT',
    statusLabel: 'Sent',
    sentAt: '2026-09-01T12:00:00.000Z',
    paidAt: null,
    notes: null,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
    items: [
      {
        id: 'item-1',
        description: 'Turnover Clean',
        quantity: 1,
        unitPrice: 225,
        lineTotal: 225,
        lineTotalFormatted: '$225.00',
        unitPriceFormatted: '$225.00',
      },
    ],
    payments: [],
    ...overrides,
  } as SerializedInvoice;
}

describe('invoice branded email — Stripe-first CTA', () => {
  const viewUrl = 'https://velocitymaid.com/invoice/tok-test-99';

  it('uses Pay by Card linking to the public invoice page', () => {
    const html = buildInvoiceBrandedEmailHtml(baseInvoice(), { variant: 'sent', viewUrl });
    const text = buildInvoiceBrandedEmailText(baseInvoice(), { variant: 'sent', viewUrl });

    expect(html).toContain('Pay by Card');
    expect(html).toContain(viewUrl);
    expect(text).toContain(`Pay by Card: ${viewUrl}`);
  });

  it('does not advertise PayPal on sent or reminder variants', () => {
    for (const variant of ['sent', 'reminder'] as const) {
      const html = buildInvoiceBrandedEmailHtml(baseInvoice(), { variant, viewUrl });
      const text = buildInvoiceBrandedEmailText(baseInvoice(), { variant, viewUrl });
      expect(html).not.toMatch(/Pay via PayPal|paypal\.me|PayPal/i);
      expect(text).not.toMatch(/Pay via PayPal|paypal\.me|PayPal/i);
    }
  });

  it('includes restrained Zelle secondary copy without auto-paid language', () => {
    const html = buildInvoiceBrandedEmailHtml(baseInvoice(), { variant: 'sent', viewUrl });
    const text = buildInvoiceBrandedEmailText(baseInvoice(), { variant: 'sent', viewUrl });
    expect(html).toContain(SERVICE_INVOICE_ZELLE_SECONDARY);
    expect(text).toContain(SERVICE_INVOICE_ZELLE_SECONDARY);
    expect(html).toMatch(/verifies the transfer/i);
    expect(html).not.toMatch(/paid successfully|payment received via zelle/i);
  });

  it('omits payment CTA when balance is zero', () => {
    const paid = baseInvoice({
      balanceDue: 0,
      balanceDueFormatted: '$0.00',
      amountPaid: 225,
      amountPaidFormatted: '$225.00',
      status: 'PAID',
    });
    const html = buildInvoiceBrandedEmailHtml(paid, { variant: 'sent', viewUrl });
    expect(html).not.toContain('Pay by Card');
  });
});
