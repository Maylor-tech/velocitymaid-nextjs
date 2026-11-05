import { describe, expect, it } from 'vitest';
import { buildInvoiceBrandedEmailHtml } from '@/lib/email/templates/invoiceBrandedEmail';
import { canSendInvoiceReminder } from '@/lib/invoices/canSendInvoiceReminder';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';

function fictionalPartial(): SerializedInvoice {
  return {
    id: 'vm-bill-r01-partial',
    invoiceNumber: 'VM-TEST-R01-PARTIAL',
    publicToken: 'vm-bill-r01-token-partial',
    jobId: null,
    customerId: null,
    clientName: 'VELOCITYMAID FICTIONAL BILLING TEST',
    clientEmail: 'partial@billing.example.test',
    clientPhone: null,
    propertyAddress: 'FICTIONAL — no service location',
    serviceType: 'Fictional billing test snapshot',
    jobDate: null,
    jobDateFormatted: '',
    dueDate: '2026-11-03T00:00:00.000Z',
    dueDateFormatted: 'November 3, 2026',
    subtotal: 100,
    tax: 0,
    discount: 0,
    total: 100,
    totalFormatted: '$100.00',
    amountPaid: 75,
    amountPaidFormatted: '$75.00',
    balanceDue: 25,
    balanceDueFormatted: '$25.00',
    status: 'PARTIALLY_PAID',
    statusLabel: 'Partially paid',
    sentAt: null,
    paidAt: null,
    notes: 'FICTIONAL BILLING TEST SNAPSHOT vm-bill-r01. Not a customer invoice.',
    createdAt: '2026-11-03T15:00:00.000Z',
    updatedAt: '2026-11-03T15:00:00.000Z',
    items: [{
      id: 'vm-bill-r01-partial-line-1',
      description: 'Fictional billing test line',
      quantity: 1,
      unitPrice: 100,
      lineTotal: 100,
      lineTotalFormatted: '$100.00',
      unitPriceFormatted: '$100.00',
    }],
    payments: [],
  } as SerializedInvoice;
}

describe('branded invoice email on a narrow screen', () => {
  it('keeps a 600px cap and lets the card shrink', () => {
    const html = buildInvoiceBrandedEmailHtml(fictionalPartial(), {
      variant: 'reminder',
      viewUrl: 'https://velocitymaid.com/invoice/vm-bill-r01-token-partial',
      reminderMessage: 'your invoice is due today.',
    });
    expect(html).toContain('width:100%;max-width:600px');
    expect(html).not.toContain('width:600px;max-width:600px');
    expect(html).toContain('@media only screen and (max-width: 600px)');
    expect(html).toContain('$25.00');
  });
});

describe('send reminder availability', () => {
  it('allows only sent, overdue, or partially paid invoices with a balance', () => {
    expect(canSendInvoiceReminder({ status: 'SENT', balanceDue: 25 })).toBe(true);
    expect(canSendInvoiceReminder({ status: 'OVERDUE', balanceDue: 25 })).toBe(true);
    expect(canSendInvoiceReminder({ status: 'PARTIALLY_PAID', balanceDue: 25 })).toBe(true);
    expect(canSendInvoiceReminder({ status: 'PAID', balanceDue: 25 })).toBe(false);
    expect(canSendInvoiceReminder({ status: 'CANCELLED', balanceDue: 100 })).toBe(false);
    expect(canSendInvoiceReminder({ status: 'DRAFT', balanceDue: 100 })).toBe(false);
    expect(canSendInvoiceReminder({ status: 'UNKNOWN', balanceDue: 25 })).toBe(false);
    expect(canSendInvoiceReminder({ status: 'SENT', balanceDue: 0 })).toBe(false);
    expect(canSendInvoiceReminder({ status: 'OVERDUE', balanceDue: 0 })).toBe(false);
    expect(canSendInvoiceReminder({ status: 'PARTIALLY_PAID', balanceDue: 0 })).toBe(false);
  });
});
