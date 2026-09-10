import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GALLERY_IMAGES,
  GALLERY_WITHHELD_SOURCE_IDS,
  HOMEPAGE_PROOF,
  MIDDLEBURY_PROOF,
  PORTFOLIO_IMAGES,
  PUBLIC_ADDRESS_DENYLIST,
  PUBLIC_PROOF_IMAGES,
  TDS_DENIED_FILENAMES,
  TURNOVER_PROOF,
  VERMONT_PROOF,
} from "../portfolio";

const repoRoot = path.resolve(__dirname, "../../..");

const MARKETING_FILES = [
  "lib/marketing/portfolio.ts",
  "components/marketing/EditorialProof.tsx",
  "components/marketing/HomepageMarketing.tsx",
  "components/marketing/MarketingPageSections.tsx",
  "components/vermont/VermontClusterLanding.tsx",
  "app/vermont/page.tsx",
  "app/gallery/page.tsx",
  "app/gallery/layout.tsx",
];

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

describe("visual trust phase 2 portfolio", () => {
  it("ships eight curated gallery images and keeps the library on disk", () => {
    expect(GALLERY_IMAGES.map((image) => image.sourceId)).toEqual([
      "IMG_9632",
      "IMG_9571",
      "IMG_9603",
      "IMG_9634",
      "100_0176",
      "IMG_6932",
      "IMG_6901",
      "100_0169",
    ]);
    expect(PORTFOLIO_IMAGES.length).toBeGreaterThanOrEqual(GALLERY_IMAGES.length);

    for (const image of PORTFOLIO_IMAGES) {
      expect(image.src.startsWith("/images/portfolio/")).toBe(true);
      const diskPath = path.join(repoRoot, "public", image.src.slice(1));
      expect(fs.existsSync(diskPath), image.src).toBe(true);
      const bytes = fs.readFileSync(diskPath);
      expect(bytes.includes(Buffer.from("Exif"))).toBe(false);
      expect(bytes.length).toBeGreaterThan(40_000);
      expect(bytes.length).toBeLessThan(800_000);
      const size = jpegDimensions(diskPath);
      expect(size.width).toBeGreaterThanOrEqual(1200);
      expect(size.width).toBeLessThanOrEqual(2000);
    }
  });

  it("maps homepage, Vermont, Middlebury, and turnover to distinct-property frames", () => {
    expect(HOMEPAGE_PROOF.featured.sourceId).toBe("IMG_9632");
    expect(HOMEPAGE_PROOF.supporting.map((image) => image.sourceId)).toEqual([
      "IMG_6932",
      "100_0176",
    ]);
    expect(VERMONT_PROOF.featured.sourceId).toBe("IMG_9634");
    expect(VERMONT_PROOF.supporting.map((image) => image.sourceId)).toEqual([
      "100_0176",
      "IMG_6932",
    ]);
    expect(MIDDLEBURY_PROOF.featured.sourceId).toBe("IMG_6932");
    expect(MIDDLEBURY_PROOF.supporting.map((image) => image.sourceId)).toEqual([
      "IMG_6901",
      "100_0169",
    ]);
    expect(TURNOVER_PROOF.featured.sourceId).toBe("IMG_9571");
    expect(TURNOVER_PROOF.supporting.map((image) => image.sourceId)).toEqual([
      "IMG_9603",
    ]);
  });

  it("withholds near-duplicate cabin frames from public proof and gallery", () => {
    const publicIds = PUBLIC_PROOF_IMAGES.map((image) => image.sourceId);
    for (const withheld of GALLERY_WITHHELD_SOURCE_IDS) {
      expect(GALLERY_IMAGES.map((image) => image.sourceId)).not.toContain(withheld);
      expect(publicIds).not.toContain(withheld);
    }
  });

  it("never publishes TDS, camera deny-list names, Drive URLs, or Unsplash", () => {
    const publicHaystack = MARKETING_FILES.filter(
      (file) => file !== "lib/marketing/portfolio.ts"
    )
      .map(readRepoFile)
      .join("\n");
    const catalog = readRepoFile("lib/marketing/portfolio.ts");

    for (const denied of TDS_DENIED_FILENAMES) {
      expect(publicHaystack).not.toContain(denied);
      expect(catalog).not.toMatch(new RegExp(`src:\\s*["'][^"']*${denied}`, "i"));
    }
    expect(publicHaystack).not.toMatch(/08\/30|TDS Ludlow|IMG_8043/i);
    expect(catalog).not.toMatch(/IMG_8043/i);
    expect(`${publicHaystack}\n${catalog}`).not.toMatch(
      /drive\.google\.com|googleusercontent\.com/i
    );
    expect(`${publicHaystack}\n${catalog}`).not.toMatch(/unsplash/i);
    expect(publicHaystack).not.toContain("New Jersey Work");
    for (const image of PORTFOLIO_IMAGES) {
      expect(image.src).not.toMatch(/IMG_9468|IMG_9470|IMG_8043/i);
    }
  });

  it("keeps public captions free of known street addresses, customer names, and room mislabels", () => {
    const publicText = PUBLIC_PROOF_IMAGES.flatMap((image) => [
      image.alt,
      image.caption,
      image.src,
    ])
      .join("\n")
      .toLowerCase();

    for (const denied of PUBLIC_ADDRESS_DENYLIST) {
      expect(publicText).not.toContain(denied);
    }
    expect(publicText).not.toMatch(/fern hill|thomson|chipman/);

    const bySource = Object.fromEntries(
      PUBLIC_PROOF_IMAGES.map((image) => [
        image.sourceId,
        `${image.alt} ${image.caption} ${image.src}`.toLowerCase(),
      ])
    );
    expect(bySource.IMG_9632).not.toMatch(/kitchen|bathroom/);
    expect(bySource.IMG_9571).not.toMatch(/bedroom|bathroom/);
    expect(bySource.IMG_9603).not.toMatch(/bathroom|bedroom/);
    expect(bySource.IMG_9634).not.toMatch(/kitchen|bathroom/);
  });

  it("does not keep camera originals or TDS files in public/images/portfolio", () => {
    const portfolioRoot = path.join(repoRoot, "public", "images", "portfolio");
    const files = fs.readdirSync(portfolioRoot, { recursive: true }) as string[];
    const names = files.map((file) => file.replaceAll("\\", "/"));
    expect(names.some((name) => name.endsWith(".jpg"))).toBe(true);
    expect(names.join("\n")).not.toMatch(/IMG_9468|IMG_9470|IMG_8043|\.heic$/i);
  });
});
