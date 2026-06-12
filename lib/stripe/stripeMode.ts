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

/** Block deposit checkout when live Stripe keys are configured (local/staging safety). */
export function assertStripeTestModeForDepositBooking(): void {
  if (!isDepositBookingMode()) return;

  const secretMode = getStripeSecretKeyMode();
  const publishableMode = getStripePublishableKeyMode();

  if (secretMode === 'live' || publishableMode === 'live') {
    throw new Error(
      'Deposit booking requires Stripe TEST keys (sk_test_ / pk_test_). ' +
        'Live keys are not allowed while BOOKING_PAYMENT_MODE=deposit. ' +
        'See docs/deposit-staging-test.md for setup.'
    );
  }

  if (secretMode !== 'test') {
    throw new Error(
      'STRIPE_SECRET_KEY must be a test secret key (sk_test_...) for deposit booking.'
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
