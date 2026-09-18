'use client';

import React from 'react';
import Image from 'next/image';
import {
  brandAssets,
  brandAssetSize,
  BRAND_NAME,
  BRAND_TAGLINE,
} from '@/lib/brand/assets';

/** Semantic logo sizes — use consistently across header, auth, portal, and mobile. */
export type BrandLogoSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'header'
  | 'auth'
  | 'portal'
  | 'mobile';

export interface BrandLogoProps {
  /**
   * @deprecated Legacy naming from the retired forest/gold/ivory system.
   * "forest" → light-background primary; "ivory" → dark-background reversed.
   */
  variant?: 'forest' | 'ivory';
  /**
   * Preferred API. "light" = light background (primary navy/cyan);
   * "dark" = dark/navy background (reversed white/cyan).
   */
  theme?: 'light' | 'dark';
  size?: BrandLogoSize;
  /** Use VM service mark only (compact / mobile / favicon-style). */
  iconOnly?: boolean;
  /**
   * When false, uses cropped horizontal masters without the tagline band.
   * When true, uses full approved lockup including COME HOME TO CLEAN.
   */
  showTagline?: boolean;
  /**
   * When true, shows the service mark below `md` breakpoints and the
   * horizontal wordmark from `md` up. Ignored when iconOnly is set.
   */
  responsiveMark?: boolean;
  className?: string;
  priority?: boolean;
}

const HEIGHT_PX: Record<BrandLogoSize, number> = {
  mobile: 28,
  xs: 24,
  sm: 28,
  portal: 28,
  header: 36,
  auth: 40,
  md: 44,
  lg: 64,
};

const MARK_PX: Record<BrandLogoSize, number> = {
  mobile: 32,
  xs: 28,
  sm: 32,
  portal: 32,
  header: 36,
  auth: 40,
  md: 44,
  lg: 56,
};

export default function BrandLogo({
  variant,
  theme,
  size = 'header',
  iconOnly = false,
  showTagline = true,
  responsiveMark = false,
  className = '',
  priority = false,
}: BrandLogoProps) {
  const resolvedTheme = theme ?? (variant === 'ivory' ? 'dark' : 'light');
  const isDarkBg = resolvedTheme === 'dark';

  const wordmarkSrc = isDarkBg
    ? showTagline
      ? brandAssets.reversed
      : brandAssets.reversedNoTag
    : showTagline
      ? brandAssets.primary
      : brandAssets.primaryNoTag;

  const markSrc = isDarkBg ? brandAssets.markWhite : brandAssets.mark;

  const h = HEIGHT_PX[size];
  const markH = MARK_PX[size];
  const wordAspect = showTagline
    ? brandAssetSize.horizontal.width / brandAssetSize.horizontal.height
    : brandAssetSize.horizontalNoTag.width /
      brandAssetSize.horizontalNoTag.height;
  const wordW = Math.round(h * wordAspect);

  const alt = showTagline
    ? `${BRAND_NAME} — ${BRAND_TAGLINE}`
    : BRAND_NAME;

  if (iconOnly) {
    return (
      <span
        className={`inline-flex shrink-0 items-center ${className}`}
        style={{ height: markH, width: markH }}
      >
        <Image
          src={markSrc}
          alt={BRAND_NAME}
          width={markH}
          height={markH}
          className="h-full w-full object-contain"
          priority={priority}
        />
      </span>
    );
  }

  if (responsiveMark) {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        <Image
          src={markSrc}
          alt={alt}
          width={markH}
          height={markH}
          className="h-8 w-8 object-contain md:hidden"
          priority={priority}
        />
        <Image
          src={wordmarkSrc}
          alt={alt}
          width={wordW}
          height={h}
          className="hidden h-9 w-auto max-w-[200px] object-contain object-left md:block lg:max-w-[240px]"
          priority={priority}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center ${className}`}
      style={{ height: h, maxWidth: Math.min(wordW, size === 'sm' || size === 'portal' ? 180 : 260) }}
    >
      <Image
        src={wordmarkSrc}
        alt={alt}
        width={wordW}
        height={h}
        className="h-full w-auto max-w-full object-contain object-left"
        priority={priority}
      />
    </span>
  );
}
