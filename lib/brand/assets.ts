/**
 * Canonical VelocityMaid brand asset paths (logo v2.3 SVG masters).
 * Do not invent alternate lockups — use these masters only.
 * Prior PNG Final Approval Pack lives at /brand/velocitymaid/_archive-v2.2/.
 */
export const BRAND_ASSET_BASE = '/brand/velocitymaid';

export const brandAssets = {
  /** Large primary horizontal lockup on light grounds */
  primary: `${BRAND_ASSET_BASE}/vm-primary-horizontal.svg`,
  /** Compact wordmark for light headers / portals (≤ ~300px wide) */
  primaryNoTag: `${BRAND_ASSET_BASE}/vm-compact-light.svg`,
  /** Compact light alias (handoff naming) */
  compactLight: `${BRAND_ASSET_BASE}/vm-compact-light.svg`,
  /** Large reversed lockup with navy plate */
  reversedPlate: `${BRAND_ASSET_BASE}/vm-reversed-dark.svg`,
  /** Compact reversed for navy UI chrome / footer */
  reversed: `${BRAND_ASSET_BASE}/vm-compact-reversed.svg`,
  /** Compact reversed without separate notag master — same file */
  reversedNoTag: `${BRAND_ASSET_BASE}/vm-compact-reversed.svg`,
  /** Compact reversed alias (handoff naming) */
  compactReversed: `${BRAND_ASSET_BASE}/vm-compact-reversed.svg`,
  /** One-color navy */
  oneColorNavy: `${BRAND_ASSET_BASE}/vm-onecolor-navy.svg`,
  oneColorNavyNoTag: `${BRAND_ASSET_BASE}/vm-onecolor-navy.svg`,
  /** One-color white */
  oneColorWhitePlate: `${BRAND_ASSET_BASE}/vm-onecolor-white.svg`,
  oneColorWhite: `${BRAND_ASSET_BASE}/vm-onecolor-white.svg`,
  oneColorWhiteNoTag: `${BRAND_ASSET_BASE}/vm-onecolor-white.svg`,
  /** Service mark on navy square */
  markDark: `${BRAND_ASSET_BASE}/vm-servicemark-dark.svg`,
  /** Service mark transparent */
  mark: `${BRAND_ASSET_BASE}/vm-servicemark-transparent.svg`,
  /** One-color navy mark fallback → transparent mark (no separate navy mark in v2.3) */
  markNavy: `${BRAND_ASSET_BASE}/vm-servicemark-transparent.svg`,
  /** Service mark for dark grounds → dark plate mark */
  markWhite: `${BRAND_ASSET_BASE}/vm-servicemark-dark.svg`,
  /** App icon source */
  appIcon: `${BRAND_ASSET_BASE}/vm-appicon-fullbleed.svg`,
  /** Favicon SVG */
  favicon: `${BRAND_ASSET_BASE}/vm-favicon.svg`,
} as const;

export type BrandAssetKey = keyof typeof brandAssets;

/** Intrinsic sizes for next/image / layout hints (SVG viewBox equivalents). */
export const brandAssetSize = {
  horizontal: { width: 1024, height: 352 },
  horizontalNoTag: { width: 1024, height: 246 },
  compact: { width: 640, height: 160 },
  mark: { width: 800, height: 800 },
} as const;

export const BRAND_NAME = 'VelocityMaid';
export const BRAND_TAGLINE = 'COME HOME TO CLEAN';
