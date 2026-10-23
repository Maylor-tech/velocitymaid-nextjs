import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  HOME_WATCH_INSPECTION_SERVICE,
  HOME_WATCH_INTAKE_BANNER,
  HOME_WATCH_NOTES_PREFILL,
  homeWatchIntakeHref,
  isHomeWatchIntake,
  mergeHomeWatchDefaults,
} from "@/lib/hostIntake/homeWatchIntake";

const repoRoot = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

const emptyIntake = {
  serviceTypes: [] as string[],
  specialInstructions: "",
  city: "",
};

describe("host intake ?service=home-watch", () => {
  it("leaves the form unchanged without the parameter", () => {
    expect(isHomeWatchIntake(null)).toBe(false);
    expect(isHomeWatchIntake("")).toBe(false);
    expect(isHomeWatchIntake("turnover")).toBe(false);
    expect(mergeHomeWatchDefaults(emptyIntake, null)).toBe(emptyIntake);
    expect(mergeHomeWatchDefaults(emptyIntake, "turnover")).toBe(emptyIntake);
  });

  it("pre-ticks inspection, pre-fills notes, and names the banner", () => {
    const next = mergeHomeWatchDefaults(emptyIntake, "home-watch");

    expect(isHomeWatchIntake("home-watch")).toBe(true);
    expect(next.city).toBe("");
    expect(next.serviceTypes).toEqual([HOME_WATCH_INSPECTION_SERVICE]);
    expect(next.specialInstructions).toBe(HOME_WATCH_NOTES_PREFILL);
    expect(HOME_WATCH_NOTES_PREFILL).toBe("Home Watch request");
    expect(HOME_WATCH_INSPECTION_SERVICE).toBe("Property inspection & photo report");
    expect(HOME_WATCH_INTAKE_BANNER).toBe(
      "Home Watch request: answer what applies; linen and turnover questions can be answered 'Host provides' / 'No — always overnight gap'."
    );
    expect(homeWatchIntakeHref("/vermont/host-intake")).toBe(
      "/vermont/host-intake?service=home-watch"
    );
  });

  it("keeps notes the visitor already typed", () => {
    const edited = mergeHomeWatchDefaults(
      {
        serviceTypes: ["Turnover cleaning between guests"],
        specialInstructions: "Call the caretaker",
      },
      "home-watch"
    );

    expect(edited.specialInstructions).toBe("Call the caretaker");
    expect(edited.serviceTypes).toEqual([
      "Turnover cleaning between guests",
      HOME_WATCH_INSPECTION_SERVICE,
    ]);
  });
});

describe("home watch finishing copy", () => {
  it("wires the intake form to the parameter and leaves the header menu alone", () => {
    const form = readRepoFile("app/vermont/host-intake/HostIntakeForm.tsx");
    expect(form).toContain("isHomeWatchIntake");
    expect(form).toContain("mergeHomeWatchDefaults");
    expect(form).toContain("HOME_WATCH_INTAKE_BANNER");
    expect(form).toContain("homeWatchDefaultsApplied");

    const homeWatch = readRepoFile("components/marketing/VermontHomeWatch.tsx");
    expect(homeWatch).toContain("homeWatchIntakeHref");
    expect(homeWatch).not.toContain("tick Property inspection");
    expect(homeWatch).toContain("tel:+18027335348");
    expect(homeWatch).toContain("https://wa.me/18027335348");
    expect(homeWatch).toContain("$150/month");
    expect(homeWatch).toContain("$275/month");
    expect(homeWatch).toContain("$75 per visit");

    const footer = readRepoFile("components/Footer.tsx");
    expect(footer).toContain("Vermont Home Watch");
    expect(footer).toContain('href="/vermont/home-watch"');

    const home = readRepoFile("components/marketing/HomepageMarketing.tsx");
    expect(home).toContain("Away for the winter? Home Watch →");
    expect(home).toContain('href="/vermont/home-watch"');

    const header = readRepoFile("components/layout/SiteHeader.tsx");
    expect(header).not.toContain("/vermont/home-watch");
    expect(header).not.toContain("Home Watch");

    const pricing = readRepoFile("components/PricingTiers.tsx");
    expect(pricing).toContain("Large Property Turnover");
    expect(pricing).toContain('price: "$275"');
    expect(pricing).toContain("from ");
    expect(pricing).toContain(" per visit");
    expect(pricing).toContain("Vermont turnover starting points");
    expect(pricing).not.toContain(">starting<");
  });
});
