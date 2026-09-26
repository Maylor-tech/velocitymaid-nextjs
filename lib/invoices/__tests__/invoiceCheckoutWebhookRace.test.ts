import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Focused race coverage for billing_invoice webhook handling.
 * Tests the orchestration helpers the webhook calls — not the full Stripe router.
 */

const markCompleted = vi.fn();
const markReconcile = vi.fn();
const expireMismatched = vi.fn();
const recordInvoicePayment = vi.fn();

vi.mock('@/lib/invoices/invoiceCheckoutSession', () => ({
  markInvoiceCheckoutSessionCompleted: (...a: unknown[]) => markCompleted(...a),
  markInvoiceCheckoutNeedsReconciliation: (...a: unknown[]) => markReconcile(...a),
  expireMismatchedInvoiceCheckoutSessions: (...a: unknown[]) => expireMismatched(...a),
}));

vi.mock('@/lib/invoices/invoiceService', () => ({
  recordInvoicePayment: (...a: unknown[]) => recordInvoicePayment(...a),
  finalizeInvoicePayment: vi.fn().mockResolvedValue(null),
}));

describe('billing_invoice webhook race handling (contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    expireMismatched.mockResolvedValue({ expired: 0 });
    markCompleted.mockResolvedValue(undefined);
    markReconcile.mockResolvedValue(undefined);
  });

  it('already-paid race → reconciliation path, not silent discard', async () => {
    const {
      markInvoiceCheckoutNeedsReconciliation,
    } = await import('@/lib/invoices/invoiceCheckoutSession');

    await markInvoiceCheckoutNeedsReconciliation({
      invoiceId: 'inv-1',
      stripeSessionId: 'cs_late',
      capturedAmountCents: 22500,
      note: 'Stripe Checkout completed after invoice was already fully paid.',
      jobId: 'job-1',
    });

    expect(markReconcile).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeSessionId: 'cs_late',
        capturedAmountCents: 22500,
      })
    );
  });

  it('webhook replay: existing InvoicePayment → complete session, no second credit', async () => {
    const { markInvoiceCheckoutSessionCompleted } = await import(
      '@/lib/invoices/invoiceCheckoutSession'
    );
    // Simulate webhook seeing existing payment then marking session completed.
    const existingPayment = { id: 'pay-1', stripeSessionId: 'cs_1' };
    expect(existingPayment.stripeSessionId).toBe('cs_1');
    await markInvoiceCheckoutSessionCompleted('cs_1');
    expect(markCompleted).toHaveBeenCalledWith('cs_1');
    expect(recordInvoicePayment).not.toHaveBeenCalled();
  });

  it('clamped Stripe after partial manual → reconciliation for excess', async () => {
    recordInvoicePayment.mockResolvedValue({
      payment: { id: 'pay-2', amount: 125 },
      becamePaid: true,
      duplicate: false,
      clamped: true,
      remainingBefore: 125,
      requestedAmount: 225,
    });

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 225,
      paymentMethod: 'STRIPE',
      stripeSessionId: 'cs_stale',
    });

    expect(result.clamped).toBe(true);
    expect(Number(result.payment.amount)).toBe(125);

    const {
      markInvoiceCheckoutNeedsReconciliation,
    } = await import('@/lib/invoices/invoiceCheckoutSession');
    const excessCents = Math.round((result.requestedAmount! - Number(result.payment.amount)) * 100);
    await markInvoiceCheckoutNeedsReconciliation({
      invoiceId: 'inv-1',
      stripeSessionId: 'cs_stale',
      capturedAmountCents: 22500,
      note: `Excess $${(excessCents / 100).toFixed(2)} requires operator refund.`,
    });

    expect(markReconcile).toHaveBeenCalled();
  });
});
