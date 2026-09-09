import { describe, expect, it } from "vitest";
import {
  SITE_ORIGIN,
  SOCIAL_IMAGES,
  absolutePageUrl,
  isBrandSafePublicImage,
  pageSocialMetadata,
  socialImageAbsoluteUrl,
  socialImageMeta,
} from "../socialImages";

describe("socialImages", () => {
  it("centralizes 1200x630 share cards under /images/social/", () => {
    expect(SOCIAL_IMAGES.default.path).toBe("/images/social/og-default.jpg");
    expect(SOCIAL_IMAGES.vermont.path).toBe("/images/social/og-vermont.jpg");
    expect(SOCIAL_IMAGES.default.width).toBe(1200);
    expect(SOCIAL_IMAGES.default.height).toBe(630);
    expect(SOCIAL_IMAGES.vermont.width).toBe(1200);
    expect(SOCIAL_IMAGES.vermont.height).toBe(630);
  });

  it("never uses Drive, Unsplash, or the Newark kitchen fallback", () => {
    const serialized = JSON.stringify(SOCIAL_IMAGES);
    expect(serialized).not.toMatch(/modern-kitchen/i);
    expect(serialized).not.toMatch(/unsplash/i);
    expect(serialized).not.toMatch(/drive\.google/i);
    expect(serialized).not.toMatch(/googleusercontent/i);
    expect(serialized).not.toMatch(/kitchen-after-newark/i);
  });

  it("builds page social metadata with explicit OG and Twitter images", () => {
    const vermont = pageSocialMetadata({
      title: "Vermont Cleaning Services | VelocityMaid",
      description: "Turnover cleaning in Vermont",
      path: "/vermont",
      image: "vermont",
    });
    expect(vermont.openGraph?.url).toBe(`${SITE_ORIGIN}/vermont`);
    expect(vermont.openGraph?.images).toEqual([socialImageMeta("vermont")]);
    expect(vermont.twitter).toEqual(
      expect.objectContaining({
        card: "summary_large_image",
        images: [SOCIAL_IMAGES.vermont.path],
      })
    );
  });

  it("does not point /book Open Graph URL at the homepage", () => {
    const book = pageSocialMetadata({
      title: "Book Cleaning | VelocityMaid",
      description: "Book a cleaning",
      path: "/book",
      image: "default",
    });
    expect(book.openGraph?.url).toBe(`${SITE_ORIGIN}/book`);
    expect(book.openGraph?.url).not.toBe(SITE_ORIGIN);
    expect(book.openGraph?.url).not.toBe(`${SITE_ORIGIN}/`);
  });

  it("blocks unsafe public image URLs", () => {
    expect(isBrandSafePublicImage("/images/social/og-default.jpg")).toBe(true);
    expect(
      isBrandSafePublicImage(
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80"
      )
    ).toBe(false);
    expect(
      isBrandSafePublicImage("https://drive.google.com/drive/folders/abc")
    ).toBe(false);
    expect(isBrandSafePublicImage(null)).toBe(false);
  });

  it("builds absolute marketing URLs from the public origin", () => {
    expect(absolutePageUrl("/")).toBe(SITE_ORIGIN);
    expect(socialImageAbsoluteUrl("default")).toBe(
      `${SITE_ORIGIN}/images/social/og-default.jpg`
    );
  });
});
