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
    badge: 'Now hiring',
    subtitle:
      'Join the VelocityMaid team and help us deliver professional cleaning and property care across Vermont and New Jersey.',
    branchSlug: 'new-jersey',
    country: 'USA',
    whatsappLabel: 'WhatsApp Number',
    whatsappPlaceholder: '+1-xxx-xxx-xxxx',
    whatsappHelper: 'Include country code (e.g. +1 for US numbers)',
    areaPlaceholder: 'e.g., Ludlow, Middlebury, Newark, Jersey City',
    title: 'Apply to be a Cleaner | VelocityMaid',
    description:
      'Apply to become a cleaner with VelocityMaid in Vermont and New Jersey. Flexible hours, competitive pay, and professional team support.',
  },
  vermont: {
    badge: 'Vermont — Okemo Valley',
    subtitle:
      'Join the VelocityMaid team and help us deliver professional cleaning and property care across Vermont and New Jersey.',
    branchSlug: 'vermont',
    country: 'USA',
    whatsappLabel: 'WhatsApp Number',
    whatsappPlaceholder: '+1-xxx-xxx-xxxx',
    whatsappHelper: 'Include country code (e.g. +1 for US numbers)',
    areaPlaceholder: 'e.g., Ludlow, Okemo Valley, Middlebury',
    title: 'Apply to be a Cleaner | VelocityMaid Vermont',
    description:
      'Apply to become a cleaner with VelocityMaid in Vermont. Serve Okemo Valley, Middlebury, and surrounding communities.',
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
