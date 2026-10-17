import { describe, expect, it } from 'vitest';
import { attributeInvoicePaymentAudit } from '@/lib/invoices/invoicePaymentAudit';

describe('attributeInvoicePaymentAudit', () => {
  it('keeps a real admin id and does not treat metadata as authorization', () => {
    expect(
      attributeInvoicePaymentAudit({
        actorId: 'admin-user-1',
        actorRole: 'ADMIN',
      })
    ).toEqual({
      actorId: 'admin-user-1',
      actorRole: 'ADMIN',
    });
  });

  it('retains a rejected sentinel as metadata and clears the User foreign key', () => {
    const attribution = attributeInvoicePaymentAudit({
      actorId: 'local-admin',
      actorRole: 'ADMIN',
    });

    expect(attribution.actorId).toBeNull();
    expect(attribution.actorRole).toBe('ADMIN');
    expect(attribution.unresolvedActorId).toBe('local-admin');
    expect(attribution).not.toHaveProperty('authorized');
    expect(attribution).not.toHaveProperty('session');
  });

  it('leaves a Stripe webhook with no actor as SYSTEM', () => {
    expect(attributeInvoicePaymentAudit({})).toEqual({
      actorId: null,
      actorRole: 'SYSTEM',
    });
  });
});
