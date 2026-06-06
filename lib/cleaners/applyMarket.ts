export type ApplyMarket = 'new-jersey' | 'vermont' | 'jamaica';

export function parseApplyMarket(
  market: string | null | undefined,
  branch?: string | null | undefined
): ApplyMarket {
  if (market === 'vermont' || market === 'jamaica' || market === 'new-jersey') {
    return market;
  }
  if (branch === 'port-antonio') return 'jamaica';
  if (branch === 'vermont') return 'vermont';
  if (branch === 'new-jersey') return 'new-jersey';
  return 'new-jersey';
}

export const APPLY_MARKET_CONFIG: Record<
  ApplyMarket,
  {
    badge: string;
    subtitle: string;
    branchSlug: string;
    country: 'USA' | 'Jamaica';
    whatsappLabel: string;
    whatsappPlaceholder: string;
    whatsappHelper: string;
    areaPlaceholder: string;
    title: string;
    description: string;
  }
> = {
  'new-jersey': {
    badge: 'New Jersey branch',
    subtitle:
      'Join the VelocityMaid NJ team and help us bring clean homes to New Jersey families.',
    branchSlug: 'new-jersey',
    country: 'USA',
    whatsappLabel: 'WhatsApp Number',
    whatsappPlaceholder: '1-973-xxx-xxxx',
    whatsappHelper: 'US number with country code',
    areaPlaceholder: 'e.g., Newark, Jersey City',
    title: 'Apply to Join | VelocityMaid New Jersey',
    description:
      'Apply to become a cleaner with VelocityMaid in New Jersey. Flexible hours, competitive pay, weekly payouts via Stripe.',
  },
  vermont: {
    badge: 'Vermont — Okemo Valley',
    subtitle:
      'Join the VelocityMaid Vermont team and help us bring clean properties to Okemo Valley hosts and homeowners.',
    branchSlug: 'vermont',
    country: 'USA',
    whatsappLabel: 'WhatsApp Number',
    whatsappPlaceholder: '1-802-xxx-xxxx',
    whatsappHelper: 'US number with country code',
    areaPlaceholder: 'e.g., Ludlow, Okemo Valley',
    title: 'Apply to Join | VelocityMaid Vermont',
    description:
      'Apply to become a cleaner with VelocityMaid in Vermont. Serve Okemo Valley short-term rentals and second homes.',
  },
  jamaica: {
    badge: 'Jamaica — Port Antonio',
    subtitle:
      'Join the VelocityMaid Jamaica team and help us bring professional cleaning to Port Antonio and surrounding areas.',
    branchSlug: 'port-antonio',
    country: 'Jamaica',
    whatsappLabel: 'WhatsApp Number',
    whatsappPlaceholder: '876-xxx-xxxx',
    whatsappHelper: 'Include country code (876) for Jamaica',
    areaPlaceholder: 'e.g., Port Antonio, Portland',
    title: 'Apply to Join | VelocityMaid Jamaica',
    description:
      'Apply to become a cleaner with VelocityMaid in Port Antonio, Jamaica.',
  },
};
