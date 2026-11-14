import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../..");

describe("TrainingIncompleteBanner messaging contract", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "components/cleaner/TrainingIncompleteBanner.tsx"),
    "utf8"
  );

  it("never renders incomplete messaging for CERTIFIED status", () => {
    expect(source).toContain("if (status === 'CERTIFIED') return null");
  });

  it("distinguishes not-started and in-progress from certified", () => {
    expect(source).toContain("Certification in progress");
    expect(source).toContain("Certification not started");
    expect(source).toContain("required modules and the certification quiz");
  });
});
