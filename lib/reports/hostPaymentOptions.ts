export type HostPaymentConfig = {
  zelleHandle: string | null;
  paypalUrl: string | null;
  cardEnabled: boolean;
};

function httpsUrl(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Only values present in the environment. No stand-in recipient or link. */
export function readHostPaymentConfig(
  env: Record<string, string | undefined> = process.env
): HostPaymentConfig {
  const zelle =
    env.VELOCITYMAID_ZELLE_HANDLE?.trim() || env.ZELLE_HANDLE?.trim() || '';
  return {
    zelleHandle: zelle || null,
    paypalUrl: httpsUrl(env.PAYPAL_ME_URL),
    cardEnabled: Boolean(env.STRIPE_SECRET_KEY?.trim()),
  };
}

export function missingHostPaymentDetails(config: HostPaymentConfig): string[] {
  const missing: string[] = [];
  if (!config.zelleHandle) {
    missing.push('Zelle recipient (VELOCITYMAID_ZELLE_HANDLE or ZELLE_HANDLE)');
  }
  if (!config.paypalUrl) missing.push('PayPal link (PAYPAL_ME_URL)');
  if (!config.cardEnabled) missing.push('Card checkout (STRIPE_SECRET_KEY)');
  return missing;
}
