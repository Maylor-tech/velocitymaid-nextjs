import type { Metadata } from "next";

/**
 * Canonical public origin for Open Graph / Twitter absolute URLs.
 * Uses existing NEXT_PUBLIC_BASE_URL when set; does not introduce a new env var.
 */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.velocitymaid.com"
).replace(/\/$/, "");

export type SocialImageKey = "default" | "vermont";

export type SocialImage = {
  path: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * Curated share cards under public/images/social/.
 * Never point these at Google Drive, CleanPhoto storage, or stock CDNs.
 */
export const SOCIAL_IMAGES: Record<SocialImageKey, SocialImage> = {
  default: {
    path: "/images/social/og-default.jpg",
    width: 1200,
    height: 630,
    alt: "VelocityMaid — guest-ready home care for Vermont vacation rentals and New Jersey households",
  },
  vermont: {
    path: "/images/social/og-vermont.jpg",
    width: 1200,
    height: 630,
    alt: "VelocityMaid Vermont vacation rental, guest-ready after professional cleaning",
  },
};

const BLOCKED_REMOTE_IMAGE =
  /unsplash\.com|images\.unsplash\.com|drive\.google\.com|googleusercontent\.com/i;

export function socialImageMeta(key: SocialImageKey): {
  url: string;
  width: number;
  height: number;
  alt: string;
} {
  const image = SOCIAL_IMAGES[key];
  return {
    url: image.path,
    width: image.width,
    height: image.height,
    alt: image.alt,
  };
}

export function socialImageAbsoluteUrl(key: SocialImageKey): string {
  return `${SITE_ORIGIN}${SOCIAL_IMAGES[key].path}`;
}

export function absolutePageUrl(path: string): string {
  if (path === "/") return SITE_ORIGIN;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

/** True when a URL is safe to emit as public marketing imagery. */
export function isBrandSafePublicImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (BLOCKED_REMOTE_IMAGE.test(trimmed)) return false;
  return trimmed.startsWith("/") || trimmed.startsWith(SITE_ORIGIN);
}

export function pageSocialMetadata(options: {
  title: string;
  description: string;
  path: string;
  image: SocialImageKey;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = socialImageMeta(options.image);
  return {
    openGraph: {
      title: options.title,
      description: options.description,
      url: absolutePageUrl(options.path),
      siteName: "VelocityMaid",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [image.url],
    },
  };
}
