import { describe, expect, it } from 'vitest';
import {
  customerInvoicePayPath,
  isInvoiceOpenForPayment,
} from '../invoicePay';

describe('invoicePay', () => {
  it('builds a public invoice path', () => {
    expect(customerInvoicePayPath('tok-1')).toBe('/invoice/tok-1');
    expect(customerInvoicePayPath(null)).toBeNull();
  });

  it('allows DRAFT invoices with a balance (Incident #001 — pay without auto-send)', () => {
    expect(
      isInvoiceOpenForPayment({ status: 'DRAFT', balanceDue: 225 })
    ).toBe(true);
    expect(
      isInvoiceOpenForPayment({ status: 'SENT', balanceDue: 225 })
    ).toBe(true);
  });

  it('blocks cancelled, paid, and zero-balance invoices', () => {
    expect(
      isInvoiceOpenForPayment({ status: 'CANCELLED', balanceDue: 100 })
    ).toBe(false);
    expect(
      isInvoiceOpenForPayment({ status: 'PAID', balanceDue: 0 })
    ).toBe(false);
    expect(
      isInvoiceOpenForPayment({ status: 'DRAFT', balanceDue: 0 })
    ).toBe(false);
  });
});
