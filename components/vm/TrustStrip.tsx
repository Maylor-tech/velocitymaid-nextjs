import * as React from "react";
import { cn } from "@/lib/utils";
import { vmFocusRing } from "./focus";

const VT_PHONE = "(802) 733-5348";
const NJ_PHONE = "(973) 280-9190";

export interface TrustStripProps {
  className?: string;
}

/**
 * Trust strip (handoff §5.1) — navy, 13px.
 * Left: Insured · Background-checked team · Re-clean guarantee
 * Right: VT / NJ tel links (flex gap, no · separator).
 */
export function TrustStrip({ className }: TrustStripProps) {
  return (
    <div className={cn("bg-vm-navy text-vm-nav-text", className)}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-body text-[13px] leading-snug">
          Insured · Background-checked team · Re-clean guarantee
        </p>
        <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 font-body text-[13px]">
          <a
            href="tel:+18027335348"
            className={cn(
              "inline-flex min-h-touch items-center font-semibold text-vm-white hover:text-vm-cyan",
              vmFocusRing
            )}
          >
            VT {VT_PHONE}
          </a>
          <a
            href="tel:+19732809190"
            className={cn(
              "inline-flex min-h-touch items-center font-semibold text-vm-white hover:text-vm-cyan",
              vmFocusRing
            )}
          >
            NJ {NJ_PHONE}
          </a>
        </div>
      </div>
    </div>
  );
}

export default TrustStrip;
