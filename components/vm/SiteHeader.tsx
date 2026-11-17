"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { vmFocusRing } from "./focus";

const NAV = [
  { href: "/hosts", label: "Vacation rentals" },
  { href: "/new-jersey", label: "Home cleaning" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#why-we-clean", label: "About" },
] as const;

const quoteClass = cn(
  "inline-flex min-h-touch items-center justify-center whitespace-nowrap rounded-vm-md bg-vm-navy px-4 py-2.5 font-heading text-sm font-bold tracking-tight text-vm-white hover:bg-vm-navy/90",
  vmFocusRing
);

export interface SiteHeaderProps {
  className?: string;
  quoteHref?: string;
}

/**
 * Redesign SiteHeader (handoff §5.2) — white sticky, compact light logo @40px,
 * Get a quote CTA, mobile sheet with nav + both phones.
 * Not mounted on pages yet (Prompt 2 — shared only).
 */
export function SiteHeader({
  className,
  quoteHref = "/contact",
}: SiteHeaderProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-vm-line bg-vm-surface",
        className
      )}
    >
      <div className="mx-auto flex h-[64px] max-w-[1200px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className={cn(
            "inline-flex min-h-touch shrink-0 items-center",
            vmFocusRing
          )}
          aria-label="VelocityMaid home"
        >
          <Logo
            tone="light"
            height={32}
            className="h-[26px] md:h-8"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-body text-sm font-semibold text-vm-text hover:text-vm-cyan-dark min-h-touch inline-flex items-center",
                vmFocusRing
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href={quoteHref} className={quoteClass}>
            Get a quote
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <Link href={quoteHref} className={cn(quoteClass, "px-3 text-xs")}>
            Get a quote
          </Link>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-touch min-w-[44px] shrink-0 items-center justify-center rounded-vm-md border border-vm-field-border text-vm-navy",
              vmFocusRing
            )}
            aria-expanded={open}
            aria-controls="vm-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="vm-mobile-nav"
          className="border-t border-vm-line bg-vm-surface px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "min-h-touch inline-flex items-center rounded-vm-md px-3 font-body text-sm font-semibold text-vm-text hover:bg-vm-canvas",
                  vmFocusRing
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-vm-line pt-4 font-body text-sm text-vm-muted">
            <a
              href="tel:+18027335348"
              className={cn("min-h-touch inline-flex items-center", vmFocusRing)}
            >
              VT (802) 733-5348
            </a>
            <a
              href="tel:+19732809190"
              className={cn("min-h-touch inline-flex items-center", vmFocusRing)}
            >
              NJ (973) 280-9190
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default SiteHeader;
