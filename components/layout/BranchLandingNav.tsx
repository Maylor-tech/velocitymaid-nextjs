"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone, Mail } from "lucide-react";

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
    "inline-flex items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold text-sm rounded-lg px-4 py-2 hover:bg-vm-cyan-dark transition";

  return (
    <header className="sticky top-0 z-50 bg-vm-navy border-b border-white/10">
      <div
        className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4`}
      >
        <Link href="/" className="font-heading font-bold text-white text-lg shrink-0">
          VelocityMaid
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4 md:gap-6">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 font-body text-white/65 hover:text-white text-sm transition"
            >
              <Phone className="w-4 h-4 shrink-0" />
              {phoneDisplay ?? phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="hidden md:flex items-center gap-2 font-body text-white/65 hover:text-white text-sm transition"
            >
              <Mail className="w-4 h-4 shrink-0" />
              {email}
            </a>
          )}
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="font-body text-white/65 hover:text-white text-sm transition"
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
          <Link href={bookingHref} className={`${ctaClassName} text-xs px-3 py-2`}>
            {bookingLabel}
          </Link>
          <button
            type="button"
            className="p-2 text-white"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                className="flex items-center gap-2 py-2 font-body text-white/65 hover:text-white text-sm"
                onClick={() => setMenuOpen(false)}
              >
                <Phone className="w-4 h-4 shrink-0" />
                {phoneDisplay ?? phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 py-2 font-body text-white/65 hover:text-white text-sm"
                onClick={() => setMenuOpen(false)}
              >
                <Mail className="w-4 h-4 shrink-0" />
                {email}
              </a>
            )}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="py-2 font-body text-white/65 hover:text-white text-sm"
                onClick={() => setMenuOpen(false)}
              >
                {secondaryLabel}
              </Link>
            )}
            <Link
              href={bookingHref}
              className="py-2 font-body text-white/65 hover:text-white text-sm"
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
