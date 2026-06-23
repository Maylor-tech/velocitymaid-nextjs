"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone, Mail } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { cn } from "@/lib/utils";

export interface BranchLandingNavProps {
  bookingHref: string;
  bookingLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  phone?: string;
  phoneDisplay?: string;
  email?: string;
  maxWidthClass?: string;
  /**
   * @deprecated No longer rendered. The approved brand system uses one
   * fixed tagline ("Come home to clean.") everywhere — there is no
   * market-specific variant. Prop kept so existing callers compile
   * unchanged.
   */
  marketTagline?: "vermont" | "new-jersey";
}

const navLinkClass =
  "font-body text-sm text-white hover:text-vm-cyan transition-colors";

const ctaClassName =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md btn-tactile transition-[transform,background-color,border-color] duration-150 bg-vm-cyan text-vm-navy font-heading font-semibold uppercase tracking-wider text-xs hover:bg-vm-cyan-dark shadow-md px-4 py-2.5";

export default function BranchLandingNav({
  bookingHref,
  bookingLabel = "Book a Clean",
  secondaryHref,
  secondaryLabel,
  phone,
  phoneDisplay,
  email,
  maxWidthClass = "max-w-6xl",
}: BranchLandingNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-vm-navy border-b border-white/10">
      <div
        className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4`}
      >
        <Link href="/" className="shrink-0 min-w-0">
          <BrandLogo variant="ivory" size="header" showTagline={false} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4 md:gap-6">
          {phone && (
            <a href={`tel:${phone}`} className={cn("flex items-center gap-2", navLinkClass)}>
              <Phone className="w-4 h-4 shrink-0" />
              {phoneDisplay ?? phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className={cn("hidden md:flex items-center gap-2", navLinkClass)}
            >
              <Mail className="w-4 h-4 shrink-0" />
              {email}
            </a>
          )}
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className={navLinkClass}>
              {secondaryLabel}
            </Link>
          )}
          <Link href={bookingHref} className={ctaClassName}>
            {bookingLabel}
          </Link>
        </div>

        {/* Mobile nav controls */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href={bookingHref}
            className={cn(ctaClassName, "text-[10px] px-3 py-2")}
          >
            {bookingLabel}
          </Link>
          <button
            type="button"
            className="p-2 text-white hover:text-vm-cyan transition-colors"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className={`sm:hidden border-t border-white/10 ${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 pb-4`}
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1 pt-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className={cn("flex items-center gap-2 py-2", navLinkClass)}
                onClick={() => setMenuOpen(false)}
              >
                <Phone className="w-4 h-4 shrink-0" />
                {phoneDisplay ?? phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className={cn("flex items-center gap-2 py-2", navLinkClass)}
                onClick={() => setMenuOpen(false)}
              >
                <Mail className="w-4 h-4 shrink-0" />
                {email}
              </a>
            )}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className={cn("py-2", navLinkClass)}
                onClick={() => setMenuOpen(false)}
              >
                {secondaryLabel}
              </Link>
            )}
            <Link
              href={bookingHref}
              className={cn("py-2", navLinkClass)}
              onClick={() => setMenuOpen(false)}
            >
              {bookingLabel}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
