import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { vmFocusRing } from "./focus";

export interface SiteFooterProps {
  className?: string;
}

/**
 * Redesign SiteFooter (handoff §5.11) — navy, compact reversed logo,
 * mailto + tel links, © VelocityMaid LLC.
 */
export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        // Extra navy bottom pad clears the floating WhatsApp FAB — no canvas strip after footer.
        "bg-vm-navy pb-28 text-vm-nav-text sm:pb-0",
        className
      )}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link
            href="/"
            className={cn("inline-flex min-h-touch items-center", vmFocusRing)}
            aria-label="VelocityMaid home"
          >
            <Logo tone="dark" height={36} />
          </Link>
          <p className="font-body text-xs tracking-wide text-vm-brand-tagline">
            COME HOME TO CLEAN.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 font-body text-sm">
          <a
            href="mailto:hello@velocitymaid.com"
            className={cn(
              "inline-flex items-center leading-snug hover:text-vm-cyan",
              vmFocusRing
            )}
          >
            hello@velocitymaid.com
          </a>
          <a
            href="tel:+18027335348"
            className={cn(
              "inline-flex items-center leading-snug hover:text-vm-cyan",
              vmFocusRing
            )}
          >
            VT (802) 733-5348
          </a>
          <a
            href="tel:+19732809190"
            className={cn(
              "inline-flex items-center leading-snug hover:text-vm-cyan",
              vmFocusRing
            )}
          >
            NJ (973) 280-9190
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1200px] px-4 py-4 font-body text-xs text-vm-nav-muted sm:px-6">
          © {year} VelocityMaid LLC
        </p>
      </div>
    </footer>
  );
}

export default SiteFooter;
