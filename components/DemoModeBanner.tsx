"use client";

import { DEMO_MODE } from "../lib/demoMode";
import { CalmAlert } from "./brand";

/** Operational notice — calm forest/gold styling, not harsh yellow */
export function DemoModeBanner() {
  if (!DEMO_MODE) return null;

  return (
    <CalmAlert
      className="rounded-none border-x-0 border-t-0 justify-center text-center"
      icon={<span aria-hidden>◇</span>}
    >
      <span className="font-sans font-bold uppercase tracking-wider text-xs text-vm-navy">
        Demo mode
      </span>
      <span className="mx-2 text-vm-text/40">·</span>
      No real payments are being processed
    </CalmAlert>
  );
}
