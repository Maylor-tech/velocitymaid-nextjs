import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "../../../../");

describe("cleaner jobs runtime fixture safety", () => {
  it("does not ship wr2Fixture or localhost-gated visual bypasses in the jobs page", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, "app/cleaner/jobs/page.tsx"),
      "utf8"
    );
    expect(source).not.toContain("wr2Fixture");
    expect(source).not.toMatch(/offers-error|offers-empty|training-unknown/);
    expect(source).not.toMatch(
      /hostname\s*===\s*["']127\.0\.0\.1["']|hostname\s*===\s*["']localhost["']/
    );
  });

  it("keeps offers error, empty, and unknown training branches in production UI code", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, "app/cleaner/jobs/page.tsx"),
      "utf8"
    );
    expect(source).toContain('kind: "error"');
    expect(source).toContain('kind: "unknown"');
    expect(source).toContain("No open offers right now");
    expect(source).toContain("Retry training status");
    expect(source).toContain("Retry offers");
  });
});
