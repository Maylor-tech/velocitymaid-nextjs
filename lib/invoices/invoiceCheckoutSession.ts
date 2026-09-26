/**
 * Durable Stripe Checkout session tracking for service invoices.
 * Invariant: no usable Checkout session may exceed the invoice's current unpaid balance.
 */
import { InvoiceCheckoutSessionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { decimalToNumber } from './invoiceUtils';
import { serializeInvoice } from './serializeInvoice';

export type CreateInvoiceCheckoutResult =
  | {
      ok: true;
      url: string;
      reused: boolean;
      sessionId: string;
      amountCents: number;
      invoice: ReturnType<typeof serializeInvoice>;
    }
  | { ok: false; error: string; status: number };

async function expireStripeSession(stripeSessionId: string): Promise<boolean> {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    if (session.status === 'open') {
      await stripe.checkout.sessions.expire(stripeSessionId);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(
      `[invoiceCheckoutSession] expire Stripe session ${stripeSessionId} failed:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Expire OPEN checkout sessions for an invoice when they no longer match the unpaid balance.
 * Pass `keepStripeSessionId` for the session currently completing via webhook.
 * When balanceCents is 0 (or omitted and invoice is fully paid), all OPEN sessions expire.
 */
export async function expireMismatchedInvoiceCheckoutSessions(params: {
  invoiceId: string;
  /** Current unpaid balance in cents. 0 expires all open sessions. */
  balanceCents: number;
  keepStripeSessionId?: string | null;
  reason?: 'EXPIRED' | 'SUPERSEDED';
}): Promise<{ expired: number }> {
  const reason = params.reason ?? (params.balanceCents <= 0 ? 'EXPIRED' : 'SUPERSEDED');
  const open = await prisma.invoiceCheckoutSession.findMany({
    where: {
      invoiceId: params.invoiceId,
      status: InvoiceCheckoutSessionStatus.OPEN,
      ...(params.keepStripeSessionId
        ? { stripeSessionId: { not: params.keepStripeSessionId } }
        : {}),
    },
  });

  let expired = 0;
  const now = new Date();
  for (const row of open) {
    const mismatch =
      params.balanceCents <= 0 || row.amountCents !== params.balanceCents;
    if (!mismatch) continue;

    await expireStripeSession(row.stripeSessionId);
    await prisma.invoiceCheckoutSession.update({
      where: { id: row.id },
      data: {
        status:
          reason === 'SUPERSEDED'
            ? InvoiceCheckoutSessionStatus.SUPERSEDED
            : InvoiceCheckoutSessionStatus.EXPIRED,
        expiredAt: now,
      },
    });
    expired += 1;
  }
  return { expired };
}

export async function markInvoiceCheckoutSessionCompleted(
  stripeSessionId: string
): Promise<void> {
  const row = await prisma.invoiceCheckoutSession.findUnique({
    where: { stripeSessionId },
  });
  if (!row) return;
  if (
    row.status === InvoiceCheckoutSessionStatus.COMPLETED ||
    row.status === InvoiceCheckoutSessionStatus.NEEDS_RECONCILIATION
  ) {
    return;
  }
  await prisma.invoiceCheckoutSession.update({
    where: { id: row.id },
    data: {
      status: InvoiceCheckoutSessionStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

/**
 * Stripe captured money that must not (fully) credit the invoice ledger.
 * Marks the session for operator refund/reconciliation — never silently discarded.
 */
export async function markInvoiceCheckoutNeedsReconciliation(params: {
  invoiceId: string;
  stripeSessionId: string;
  capturedAmountCents: number;
  note: string;
  jobId?: string | null;
}): Promise<void> {
  const existing = await prisma.invoiceCheckoutSession.findUnique({
    where: { stripeSessionId: params.stripeSessionId },
  });

  if (existing) {
    await prisma.invoiceCheckoutSession.update({
      where: { id: existing.id },
      data: {
        status: InvoiceCheckoutSessionStatus.NEEDS_RECONCILIATION,
        completedAt: existing.completedAt ?? new Date(),
        capturedAmountCents: params.capturedAmountCents,
        reconciliationNote: params.note,
      },
    });
  } else {
    await prisma.invoiceCheckoutSession.create({
      data: {
        invoiceId: params.invoiceId,
        stripeSessionId: params.stripeSessionId,
        amountCents: params.capturedAmountCents,
        status: InvoiceCheckoutSessionStatus.NEEDS_RECONCILIATION,
        completedAt: new Date(),
        capturedAmountCents: params.capturedAmountCents,
        reconciliationNote: params.note,
      },
    });
  }

  try {
    const { createAdminNotification } = await import(
      '@/lib/notifications/adminNotificationCenter'
    );
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      select: { invoiceNumber: true, jobId: true },
    });
    const dollars = (params.capturedAmountCents / 100).toFixed(2);
    await createAdminNotification({
      type: 'INVOICE_STRIPE_OVERPAYMENT',
      severity: 'CRITICAL',
      jobId: params.jobId ?? invoice?.jobId ?? null,
      message: `Stripe captured $${dollars} on invoice ${invoice?.invoiceNumber ?? params.invoiceId} after balance was already satisfied (or exceeded remaining due). Refund/reconcile required. Session ${params.stripeSessionId}. ${params.note}`,
      actionUrl: invoice?.jobId
        ? `/admin/jobs/${invoice.jobId}`
        : `/admin/invoices/${params.invoiceId}`,
    });
  } catch (err) {
    console.error(
      '[invoiceCheckoutSession] failed to write overpayment notification:',
      err
    );
  }

  console.error(
    `[invoiceCheckoutSession] NEEDS_RECONCILIATION invoice=${params.invoiceId} session=${params.stripeSessionId} capturedCents=${params.capturedAmountCents} note=${params.note}`
  );
}

/**
 * Create or reuse a Stripe Checkout session for the invoice's current unpaid balance.
 */
export async function createOrReuseInvoiceCheckout(params: {
  publicToken: string;
  origin: string;
}): Promise<CreateInvoiceCheckoutResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: false, error: 'Online payments are not configured', status: 503 };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: params.publicToken },
    include: { items: true, payments: true },
  });
  if (!invoice || invoice.status === 'CANCELLED') {
    return { ok: false, error: 'Invoice not found', status: 404 };
  }
  if (invoice.status === 'PAID') {
    return { ok: false, error: 'This invoice is already paid', status: 400 };
  }

  const balance = decimalToNumber(invoice.balanceDue);
  const amountCents = Math.round(balance * 100);
  if (balance <= 0 || amountCents <= 0) {
    return { ok: false, error: 'Nothing due on this invoice', status: 400 };
  }

  const openSessions = await prisma.invoiceCheckoutSession.findMany({
    where: {
      invoiceId: invoice.id,
      status: InvoiceCheckoutSessionStatus.OPEN,
    },
    orderBy: { createdAt: 'desc' },
  });

  const stripe = getStripe();

  // Reuse when amount still exactly matches current balance and Stripe says open.
  const reusable = openSessions.find((s) => s.amountCents === amountCents);
  if (reusable) {
    try {
      const remote = await stripe.checkout.sessions.retrieve(reusable.stripeSessionId);
      if (remote.status === 'open' && remote.url) {
        // Expire any other open sessions that somehow exist (should be rare).
        await expireMismatchedInvoiceCheckoutSessions({
          invoiceId: invoice.id,
          balanceCents: amountCents,
          keepStripeSessionId: reusable.stripeSessionId,
          reason: 'SUPERSEDED',
        });
        return {
          ok: true,
          url: remote.url,
          reused: true,
          sessionId: reusable.stripeSessionId,
          amountCents,
          invoice: serializeInvoice(invoice),
        };
      }
      // Remote no longer open — mark expired locally.
      await prisma.invoiceCheckoutSession.update({
        where: { id: reusable.id },
        data: {
          status: InvoiceCheckoutSessionStatus.EXPIRED,
          expiredAt: new Date(),
        },
      });
    } catch (err) {
      console.warn(
        `[invoiceCheckoutSession] retrieve reusable session failed:`,
        err instanceof Error ? err.message : err
      );
      await prisma.invoiceCheckoutSession.update({
        where: { id: reusable.id },
        data: {
          status: InvoiceCheckoutSessionStatus.EXPIRED,
          expiredAt: new Date(),
        },
      });
    }
  }

  // Expire all remaining open sessions (wrong amount or stale) before creating replacement.
  await expireMismatchedInvoiceCheckoutSessions({
    invoiceId: invoice.id,
    balanceCents: 0, // force expire all open
    reason: 'SUPERSEDED',
  });

  // Re-read invoice so we never create against a stale balance after concurrent payment.
  const fresh = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: { items: true, payments: true },
  });
  if (!fresh || fresh.status === 'CANCELLED') {
    return { ok: false, error: 'Invoice not found', status: 404 };
  }
  if (fresh.status === 'PAID') {
    return { ok: false, error: 'This invoice is already paid', status: 400 };
  }
  const freshBalance = decimalToNumber(fresh.balanceDue);
  const freshCents = Math.round(freshBalance * 100);
  if (freshBalance <= 0 || freshCents <= 0) {
    return { ok: false, error: 'Nothing due on this invoice', status: 400 };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `VelocityMaid Invoice ${fresh.invoiceNumber}`,
            description: fresh.serviceType,
          },
          unit_amount: freshCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${params.origin}/invoice/${params.publicToken}?paid=1`,
    cancel_url: `${params.origin}/invoice/${params.publicToken}`,
    customer_email: fresh.clientEmail || undefined,
    metadata: {
      paymentType: 'billing_invoice',
      invoiceId: fresh.id,
      invoiceNumber: fresh.invoiceNumber,
      balanceCentsAtCheckout: String(freshCents),
    },
  });

  if (!session.url) {
    return { ok: false, error: 'Stripe did not return a checkout URL', status: 502 };
  }

  await prisma.invoiceCheckoutSession.create({
    data: {
      invoiceId: fresh.id,
      stripeSessionId: session.id,
      amountCents: freshCents,
      status: InvoiceCheckoutSessionStatus.OPEN,
    },
  });

  return {
    ok: true,
    url: session.url,
    reused: false,
    sessionId: session.id,
    amountCents: freshCents,
    invoice: serializeInvoice(fresh),
  };
}

/** Helper for tests / callers that need Prisma decimal balance → cents. */
export function balanceToCents(balanceDue: unknown): number {
  return Math.round(decimalToNumber(balanceDue) * 100);
}
