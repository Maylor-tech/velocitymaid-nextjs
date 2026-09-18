/**
 * Canonical VelocityMaid brand asset paths (approved Final Approval Pack).
 * Do not invent alternate lockups — use these masters only.
 */
export const BRAND_ASSET_BASE = '/brand/velocitymaid';

export const brandAssets = {
  /** 01 — Primary horizontal (navy + cyan) on transparent, full lockup with tagline */
  primary: `${BRAND_ASSET_BASE}/velocitymaid-primary.png`,
  /** Primary without tagline — nav/header */
  primaryNoTag: `${BRAND_ASSET_BASE}/velocitymaid-primary-notag.png`,
  /** 02 — Reversed on navy plate (presentation) */
  reversedPlate: `${BRAND_ASSET_BASE}/velocitymaid-reversed.png`,
  /** Reversed with navy plate knocked out — dark UI backgrounds */
  reversed: `${BRAND_ASSET_BASE}/velocitymaid-reversed-clear.png`,
  /** Reversed without tagline */
  reversedNoTag: `${BRAND_ASSET_BASE}/velocitymaid-reversed-notag.png`,
  /** 03 — One-color navy */
  oneColorNavy: `${BRAND_ASSET_BASE}/velocitymaid-onecolor-navy.png`,
  oneColorNavyNoTag: `${BRAND_ASSET_BASE}/velocitymaid-onecolor-navy-notag.png`,
  /** 04 — One-color white (plate + clear) */
  oneColorWhitePlate: `${BRAND_ASSET_BASE}/velocitymaid-onecolor-white.png`,
  oneColorWhite: `${BRAND_ASSET_BASE}/velocitymaid-onecolor-white-clear.png`,
  oneColorWhiteNoTag: `${BRAND_ASSET_BASE}/velocitymaid-onecolor-white-notag.png`,
  /** 05 — Service mark on navy rounded square */
  markDark: `${BRAND_ASSET_BASE}/velocitymaid-mark-dark.png`,
  /** 06 — Service mark transparent (navy V + cyan M) */
  mark: `${BRAND_ASSET_BASE}/velocitymaid-mark.png`,
  /** 07 — Service mark one-color navy */
  markNavy: `${BRAND_ASSET_BASE}/velocitymaid-mark-navy.png`,
  /** 08 — Service mark one-color white on navy square */
  markWhite: `${BRAND_ASSET_BASE}/velocitymaid-mark-white.png`,
} as const;

export type BrandAssetKey = keyof typeof brandAssets;

/** Intrinsic pixel sizes of masters (for next/image). */
export const brandAssetSize = {
  horizontal: { width: 1024, height: 352 },
  horizontalNoTag: { width: 1024, height: 246 },
  mark: { width: 800, height: 800 },
} as const;

export const BRAND_NAME = 'VelocityMaid';
export const BRAND_TAGLINE = 'COME HOME TO CLEAN';
