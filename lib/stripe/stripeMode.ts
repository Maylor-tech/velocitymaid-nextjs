import { isDepositBookingMode } from '@/lib/booking/paymentConfig';

export type StripeKeyMode = 'test' | 'live' | 'unknown';

export function getStripeSecretKeyMode(): StripeKeyMode {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (key.startsWith('sk_test_')) return 'test';
  if (key.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

export function getStripePublishableKeyMode(): StripeKeyMode {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  if (key.startsWith('pk_test_')) return 'test';
  if (key.startsWith('pk_live_')) return 'live';
  return 'unknown';
}

export function isStripeLiveModeConfigured(): boolean {
  return (
    getStripeSecretKeyMode() === 'live' || getStripePublishableKeyMode() === 'live'
  );
}

/** Block deposit + live keys in local dev; production may use live keys with deposit mode. */
export function assertStripeTestModeForDepositBooking(): void {
  if (!isDepositBookingMode()) return;

  const secretMode = getStripeSecretKeyMode();
  const publishableMode = getStripePublishableKeyMode();

  if (process.env.NODE_ENV === 'production') {
    if (secretMode === 'live' && publishableMode === 'live') return;
    if (secretMode === 'test' && publishableMode === 'test') return;
    if (secretMode === 'unknown' || publishableMode === 'unknown') {
      throw new Error(
        'Stripe keys must both be live (sk_live_/pk_live_) or both be test (sk_test_/pk_test_) for deposit booking.'
      );
    }
    throw new Error(
      'Stripe secret and publishable keys must match mode (both live or both test).'
    );
  }

  if (secretMode === 'live' || publishableMode === 'live') {
    throw new Error(
      'Deposit booking with live Stripe keys is only allowed in production. ' +
        'Use sk_test_/pk_test_ locally, or set BOOKING_PAYMENT_MODE=full for local full-payment testing.'
    );
  }

  if (secretMode !== 'test') {
    throw new Error(
      'STRIPE_SECRET_KEY must be a test secret key (sk_test_...) for local deposit booking.'
    );
  }
}

export function getStripeModeWarningMessage(): string | null {
  if (!isDepositBookingMode()) return null;
  if (isStripeLiveModeConfigured()) {
    return (
      'WARNING: Live Stripe keys detected with deposit booking enabled. ' +
      'Switch to sk_test_/pk_test_ before E2E testing.'
    );
  }
  return null;
}
