/**
 * Guest-facing support contact by branch / market.
 */

export const SUPPORT_EMAIL = 'hello@velocitymaid.com';

export type MarketSupportContact = {
  market: 'vermont' | 'new-jersey';
  marketLabel: string;
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  /** Vermont only — NJ uses email + phone backup (no WhatsApp). */
  whatsappUrl?: string | null;
};

export const VERMONT_WHATSAPP_URL = 'https://wa.me/18027335348';

export const VERMONT_SUPPORT: MarketSupportContact = {
  market: 'vermont',
  marketLabel: 'Vermont',
  phoneDisplay: '(802) 733-5348',
  phoneTel: '8027335348',
  email: SUPPORT_EMAIL,
  whatsappUrl: VERMONT_WHATSAPP_URL,
};

/** NJ line lost — email primary, Vermont phone as call backup, no WhatsApp. */
export const NEW_JERSEY_SUPPORT: MarketSupportContact = {
  market: 'new-jersey',
  marketLabel: 'New Jersey',
  phoneDisplay: VERMONT_SUPPORT.phoneDisplay,
  phoneTel: VERMONT_SUPPORT.phoneTel,
  email: SUPPORT_EMAIL,
  whatsappUrl: null,
};

function isVermontAddressText(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('vermont') ||
    /\bvt\b/.test(lower) ||
    lower.includes(', vt') ||
    lower.endsWith(' vt')
  );
}

function isVermontBranch(branch: {
  slug?: string | null;
  state?: string | null;
  name?: string | null;
  regionLabel?: string | null;
} | null | undefined): boolean {
  if (!branch) return false;
  const slug = (branch.slug || '').toLowerCase();
  const state = (branch.state || '').toUpperCase();
  const name = (branch.name || '').toLowerCase();
  const region = (branch.regionLabel || '').toLowerCase();
  return (
    slug.includes('vermont') ||
    slug === 'vt' ||
    state === 'VT' ||
    name.includes('vermont') ||
    region.includes('vermont')
  );
}

export function resolveMarketSupportFromBranch(
  branch: {
    slug?: string | null;
    state?: string | null;
    name?: string | null;
    regionLabel?: string | null;
    primaryPhone?: string | null;
    whatsappNumber?: string | null;
  } | null | undefined
): MarketSupportContact {
  if (isVermontBranch(branch)) {
    return { ...VERMONT_SUPPORT };
  }
  return { ...NEW_JERSEY_SUPPORT };
}

/** Resolve support line from branch + customer address/state. */
export function resolveMarketSupportForCustomer(customer: {
  state?: string | null;
  defaultAddress?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  Branch?: {
    slug?: string | null;
    state?: string | null;
    name?: string | null;
    regionLabel?: string | null;
    primaryPhone?: string | null;
    whatsappNumber?: string | null;
  } | null;
}): MarketSupportContact {
  const state = (customer.state || '').toUpperCase();
  const addressBlob = [
    customer.defaultAddress,
    customer.addressLine1,
    customer.city,
  ]
    .filter(Boolean)
    .join(' ');

  const isVt =
    isVermontBranch(customer.Branch) ||
    state === 'VT' ||
    state === 'VERMONT' ||
    isVermontAddressText(addressBlob);

  return isVt ? { ...VERMONT_SUPPORT } : { ...NEW_JERSEY_SUPPORT };
}

export function resolveMarketSupportFromBranchId(
  branchId: string | null | undefined,
  loadBranch: (id: string) => Promise<{
    slug: string;
    state: string;
    name: string;
    regionLabel: string | null;
    primaryPhone: string;
    whatsappNumber: string;
  } | null>
): Promise<MarketSupportContact> {
  if (!branchId) return Promise.resolve({ ...NEW_JERSEY_SUPPORT });
  return loadBranch(branchId).then((b) => resolveMarketSupportFromBranch(b));
}

/** Primary href for "Get help" / support shortcuts (WhatsApp when available, else email). */
export function primarySupportHref(contact: MarketSupportContact): string {
  if (contact.whatsappUrl) return contact.whatsappUrl;
  return `mailto:${contact.email}`;
}
