"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone, Mail } from "lucide-react";
import { BrandLogo } from "@/components/brand";

export interface BranchLandingNavProps {
  bookingHref: string;
  bookingLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  phone?: string;
  phoneDisplay?: string;
  email?: string;
  maxWidthClass?: string;
}

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

  const ctaClassName =
    "inline-flex items-center justify-center bg-brand-forest text-brand-ivory font-sans font-bold uppercase tracking-wider text-xs rounded px-4 py-2.5 hover:bg-brand-forest-hover transition shadow-sm";

  return (
    <header className="sticky top-0 z-50 bg-brand-ivory/95 backdrop-blur-sm border-b border-brand-forest/10">
      <div
        className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4`}
      >
        <Link href="/" className="shrink-0 min-w-0">
          <BrandLogo size="header" className="hidden sm:flex" />
          <BrandLogo size="mobile" showTagline={false} className="sm:hidden" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4 md:gap-6">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 font-sans text-brand-slate/70 hover:text-brand-forest text-sm transition"
            >
              <Phone className="w-4 h-4 shrink-0" />
              {phoneDisplay ?? phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="hidden md:flex items-center gap-2 font-sans text-brand-slate/70 hover:text-brand-forest text-sm transition"
            >
              <Mail className="w-4 h-4 shrink-0" />
              {email}
            </a>
          )}
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="font-sans text-brand-slate/70 hover:text-brand-forest text-sm transition"
            >
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
            className={`${ctaClassName} text-[10px] px-3 py-2`}
          >
            {bookingLabel}
          </Link>
          <button
            type="button"
            className="p-2 text-brand-forest"
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
          className={`sm:hidden border-t border-brand-forest/10 ${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 pb-4`}
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1 pt-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 py-2 font-sans text-brand-slate/70 hover:text-brand-forest text-sm"
                onClick={() => setMenuOpen(false)}
              >
                <Phone className="w-4 h-4 shrink-0" />
                {phoneDisplay ?? phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 py-2 font-sans text-brand-slate/70 hover:text-brand-forest text-sm"
                onClick={() => setMenuOpen(false)}
              >
                <Mail className="w-4 h-4 shrink-0" />
                {email}
              </a>
            )}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="py-2 font-sans text-brand-slate/70 hover:text-brand-forest text-sm"
                onClick={() => setMenuOpen(false)}
              >
                {secondaryLabel}
              </Link>
            )}
            <Link
              href={bookingHref}
              className="py-2 font-sans text-brand-slate/70 hover:text-brand-forest text-sm"
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
