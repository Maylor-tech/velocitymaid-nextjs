export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is missing');
  if (secretKey.startsWith('pk_')) {
    throw new Error('Use Stripe SECRET key (sk_...), not pk_');
  }
  return new Stripe(secretKey);
}

export function getAppBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  if (!baseUrl.startsWith('http')) {
    throw new Error(`BASE_URL is invalid: ${baseUrl}`);
  }
  return baseUrl;
}

type BalanceCheckoutParams = {
  jobId: string;
  email: string;
  balanceDue: number;
  currency: string;
  quotedTotal: number;
  depositAmount: number;
  amountPaid: number;
  successPath: string;
  cancelPath: string;
  metadata?: Record<string, string>;
};

export async function createBalanceCheckoutSession(
  params: BalanceCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();
  const balanceCents = Math.round(params.balanceDue * 100);

  if (balanceCents <= 0) {
    throw new Error('No balance due for this job');
  }

  const metadata: Record<string, string> = {
    jobId: params.jobId,
    paymentType: 'balance',
    quotedTotal: String(params.quotedTotal),
    depositAmount: String(params.depositAmount),
    amountPaidBefore: String(params.amountPaid),
    email: params.email,
    ...params.metadata,
  };

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.email,
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: 'VelocityMaid Service Balance',
            description: `Remaining balance for job ${params.jobId.slice(-6).toUpperCase()}`,
          },
          unit_amount: balanceCents,
        },
        quantity: 1,
      },
    ],
    metadata,
    success_url: `${baseUrl}${params.successPath}${
      params.successPath.includes('?') ? '&' : '?'
    }session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}${params.cancelPath}`,
    billing_address_collection: 'required',
  });
}
