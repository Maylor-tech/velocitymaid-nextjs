/**
 * Guest-facing support contact by branch / market.
 */

export type MarketSupportContact = {
  market: 'vermont' | 'new-jersey';
  marketLabel: string;
  phoneDisplay: string;
  phoneTel: string;
  whatsappUrl: string;
};

const VERMONT: MarketSupportContact = {
  market: 'vermont',
  marketLabel: 'Vermont',
  phoneDisplay: '(802) 733-5348',
  phoneTel: '8027335348',
  whatsappUrl: 'https://wa.me/18027335348',
};

const NEW_JERSEY: MarketSupportContact = {
  market: 'new-jersey',
  marketLabel: 'New Jersey',
  phoneDisplay: '(973) 280-9190',
  phoneTel: '9732809190',
  whatsappUrl: 'https://wa.me/19732809190',
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
  const base = isVermontBranch(branch) ? VERMONT : NEW_JERSEY;

  if (branch?.primaryPhone?.trim()) {
    const digits = branch.primaryPhone.replace(/\D/g, '');
    const display =
      branch.primaryPhone.includes('(') ? branch.primaryPhone : formatUsPhone(digits);
    const tel = digits.length >= 10 ? digits.slice(-10) : base.phoneTel;
    const wa =
      branch.whatsappNumber?.replace(/\D/g, '') ||
      (tel.length >= 10 ? `1${tel}` : base.phoneTel);
    return {
      ...base,
      phoneDisplay: display,
      phoneTel: tel,
      whatsappUrl: `https://wa.me/${wa.startsWith('1') ? wa : `1${wa}`}`,
    };
  }

  return base;
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

  return resolveMarketSupportFromBranch(
    isVt
      ? {
          slug: 'vermont',
          state: 'VT',
          name: 'Vermont',
          regionLabel: 'Vermont',
          primaryPhone: VERMONT.phoneDisplay,
          whatsappNumber: '18027335348',
        }
      : customer.Branch
  );
}

function formatUsPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(-10);
  if (d.length !== 10) return digits;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
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
  if (!branchId) return Promise.resolve(NEW_JERSEY);
  return loadBranch(branchId).then((b) => resolveMarketSupportFromBranch(b));
}
