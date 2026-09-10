import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SOCIAL_IMAGES } from "../socialImages";
import { VERMONT_CLUSTERS } from "@/lib/vermont/clusters";
import {
  LUDLOW_PHOTO_PATHS,
  MIDDLEBURY_PHOTO_PATHS,
} from "@/lib/vermont/middleburyPhotos";

const repoRoot = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function jpegDimensions(filePath: string): { width: number; height: number } {
  const buffer = fs.readFileSync(filePath);
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      throw new Error(`Invalid JPEG marker in ${filePath}`);
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error(`No JPEG size marker in ${filePath}`);
}

describe("visual trust phase 1 wiring", () => {
  it("ships stripped 1200x630 social JPEGs", () => {
    for (const key of ["default", "vermont"] as const) {
      const publicPath = path.join(repoRoot, "public", SOCIAL_IMAGES[key].path.slice(1));
      expect(fs.existsSync(publicPath)).toBe(true);
      const size = jpegDimensions(publicPath);
      expect(size).toEqual({ width: 1200, height: 630 });
      const bytes = fs.readFileSync(publicPath);
      expect(bytes.includes(Buffer.from("Exif"))).toBe(false);
      expect(bytes.length).toBeGreaterThan(40_000);
      expect(bytes.length).toBeLessThan(400_000);
    }
  });

  it("sets root OG, Twitter, and JSON-LD to the curated default card", () => {
    const layout = readRepoFile("app/layout.tsx");
    expect(layout).toContain("metadataBase");
    expect(layout).toContain('socialImageMeta("default")');
    expect(layout).toContain("SOCIAL_IMAGES.default.path");
    expect(layout).toContain('socialImageAbsoluteUrl("default")');
    expect(layout).not.toContain("modern-kitchen.jpg");
  });

  it("gives Vermont pages explicit OG and Twitter images that are not NJ", () => {
    const files = [
      "app/vermont/page.tsx",
      "app/vermont/okemo/page.tsx",
      "app/vermont/middlebury/page.tsx",
      "app/vermont/host-intake/page.tsx",
    ];
    for (const file of files) {
      const source = readRepoFile(file);
      expect(source).toContain('image: "vermont"');
      expect(source).toContain("pageSocialMetadata");
      expect(source).not.toContain("modern-kitchen.jpg");
      expect(source).not.toContain("bedroomLoft");
    }
  });

  it("sets / and /book to the default card with a page-specific OG URL", () => {
    const home = readRepoFile("app/page.tsx");
    expect(home).toContain('path: "/"');
    expect(home).toContain('image: "default"');

    const book = readRepoFile("app/book/layout.tsx");
    expect(book).toContain('path: "/book"');
    expect(book).toContain('image: "default"');
  });

  it("keeps Okemo on Ludlow imagery and Middlebury on Middlebury imagery", () => {
    expect(VERMONT_CLUSTERS.okemo.heroImage).toBe(LUDLOW_PHOTO_PATHS.exteriorHero);
    expect(VERMONT_CLUSTERS.okemo.heroImage).not.toBe(
      MIDDLEBURY_PHOTO_PATHS.bedroomLoft
    );
    for (const image of Object.values(VERMONT_CLUSTERS.okemo.contentImages)) {
      expect(image.src).toContain("ludlow");
      expect(image.src).not.toContain("middlebury");
    }
    expect(VERMONT_CLUSTERS.middlebury.heroImage).toBe(
      MIDDLEBURY_PHOTO_PATHS.exteriorHero
    );
    for (const image of Object.values(VERMONT_CLUSTERS.middlebury.contentImages)) {
      expect(image.src).toContain("middlebury");
    }
  });

  it("removes missing gallery files and Unsplash kitchen fallbacks", () => {
    const gallery = readRepoFile("app/gallery/page.tsx");
    const missing = [
      "bathroom-sink-02.jpg",
      "bathroom-window-01.jpg",
      "bedroom-canopy-01.jpg",
      "bedroom-gray-01.jpg",
      "dining-rustic-01.jpg",
      "kitchen-cabin-01.jpg",
      "kitchen-cabin-02.jpg",
      "loft-blue-chair-01.jpg",
    ];
    for (const file of missing) {
      expect(gallery).not.toContain(file);
    }

    expect(gallery).toContain("@/lib/marketing/portfolio");
    expect(gallery).toContain("GALLERY_IMAGES");
    expect(gallery).not.toContain("/images/gallery/");

    const gallerySrcs = [
      ...gallery.matchAll(/src:\s*['"](\/images\/(?:gallery|portfolio)\/[^'"]+)['"]/g),
    ].map((match) => match[1]);
    for (const src of gallerySrcs) {
      const diskPath = path.join(repoRoot, "public", src.slice(1));
      expect(fs.existsSync(diskPath), src).toBe(true);
    }

    const unsplashHaystack = [
      "app/locations/new-jersey/[city]/page.tsx",
      "app/locations/new-jersey/components/BeforeAfterGallery.tsx",
      "app/locations/new-jersey/page.tsx",
      "app/layout.tsx",
    ]
      .map(readRepoFile)
      .join("\n");
    expect(unsplashHaystack).not.toMatch(/unsplash/i);
    expect(unsplashHaystack).not.toContain("1556909114");
  });
});
