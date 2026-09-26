import { describe, expect, it } from 'vitest';
import {
  getServiceInvoiceZelleDestination,
  getVelocityMaidZelleDestination,
  SERVICE_INVOICE_ZELLE_SECONDARY,
} from '@/lib/tips/zelleDestination';

describe('Zelle destinations remain manual', () => {
  it('keeps tip Zelle instructions tip-specific', () => {
    const tip = getVelocityMaidZelleDestination();
    expect(tip.instructions).toMatch(/tip/i);
    expect(tip.instructions).toMatch(/verifies the transfer/i);
  });

  it('service invoice Zelle is secondary and not auto-confirmed', () => {
    expect(SERVICE_INVOICE_ZELLE_SECONDARY).toBe(
      'Prefer Zelle? Payment instructions are also available.'
    );
    const dest = getServiceInvoiceZelleDestination();
    expect(dest.instructions).toMatch(/verifies the transfer/i);
    expect(dest.instructions).toMatch(/does not mark the invoice paid/i);
    expect(dest.instructions).not.toMatch(/automatically paid|marked paid/i);
  });
});
