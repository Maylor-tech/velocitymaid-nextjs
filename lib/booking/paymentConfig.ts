export type BookingPaymentMode = 'full' | 'deposit';

export function getBookingPaymentMode(): BookingPaymentMode {
  const mode =
    process.env.BOOKING_PAYMENT_MODE ??
    process.env.NEXT_PUBLIC_BOOKING_PAYMENT_MODE ??
    'full';
  return mode === 'deposit' ? 'deposit' : 'full';
}

export function isDepositBookingMode(): boolean {
  return getBookingPaymentMode() === 'deposit';
}

export function getBookingDepositCents(): number {
  const cents = parseInt(process.env.BOOKING_DEPOSIT_CENTS || '2500', 10);
  return Number.isFinite(cents) && cents > 0 ? cents : 2500;
}

export function getBookingDepositDollars(): number {
  return getBookingDepositCents() / 100;
}
