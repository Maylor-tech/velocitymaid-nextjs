import { describe, expect, it } from 'vitest';

// Minimal surface check: clean-complete no longer requires/advertises PayPal.
import type { SendCleanCompleteEmailParams } from '@/lib/email/sendCleanCompleteEmail';
import { SERVICE_INVOICE_ZELLE_SECONDARY } from '@/lib/tips/zelleDestination';

describe('clean-complete email params (Stripe-first)', () => {
  it('uses invoiceViewUrl instead of paypalEmail', () => {
    const params: SendCleanCompleteEmailParams = {
      toEmail: 'a@b.com',
      toName: 'Jeff',
      propertyAddress: '354 Grout Road',
      cleanDate: new Date(),
      photos: [],
      invoiceAmount: 225,
      invoiceViewUrl: 'https://velocitymaid.com/invoice/tok',
      market: 'vermont',
    };
    expect(params).not.toHaveProperty('paypalEmail');
    expect(params.invoiceViewUrl).toContain('/invoice/');
    expect(SERVICE_INVOICE_ZELLE_SECONDARY).toMatch(/Prefer Zelle/);
  });
});
