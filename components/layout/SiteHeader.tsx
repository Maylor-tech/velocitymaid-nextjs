"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";

const LOCATIONS = [
  { href: "/locations/new-jersey", label: "New Jersey" },
  { href: "/vermont", label: "Vermont" },
];

export interface SiteHeaderProps {
  /** Use hash links for homepage sections */
  homeAnchors?: boolean;
  bookingHref?: string;
}

export default function SiteHeader({
  homeAnchors = false,
  bookingHref = "/book?branch=new-jersey",
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = homeAnchors
    ? [
        { href: "/#services", label: "Services" },
        { href: "/#why-us", label: "Why Us" },
        { href: "/#testimonials", label: "Reviews" },
        { href: "/#pricing", label: "Pricing" },
        { href: "/#faq", label: "FAQ" },
      ]
    : [
        { href: "/pricing", label: "Pricing" },
        { href: "/contact", label: "Contact" },
        { href: "/partners", label: "Partners" },
      ];

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-vm-navy border-b border-white/10 transition-all duration-300 ${
        scrolled ? "shadow-md py-2" : "py-3"
      }`}
    >
      <div className="mx-auto max-w-marketing px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-heading font-bold text-white text-lg shrink-0"
          >
            VelocityMaid
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Main">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-body text-white/65 hover:text-white text-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="relative group">
              <button
                type="button"
                className="font-body text-white/65 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                Locations
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-vm-navy rounded-lg shadow-xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-2">
                  {LOCATIONS.map((loc) => (
                    <Link
                      key={loc.href}
                      href={loc.href}
                      className="block px-4 py-2 text-sm font-body text-white/65 hover:bg-white/10 hover:text-white"
                    >
                      {loc.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/customer/login"
              className="font-body text-white/65 hover:text-white text-sm transition-colors"
            >
              Customer Portal
            </Link>
            <Link
              href={bookingHref}
              className="bg-vm-cyan text-vm-navy font-heading font-semibold text-sm rounded-lg px-4 py-2 hover:bg-vm-cyan-dark transition"
            >
              Book a Service
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href={bookingHref}
              className="bg-vm-cyan text-vm-navy font-heading font-semibold text-xs rounded-lg px-3 py-2 hover:bg-vm-cyan-dark transition"
            >
              Book
            </Link>
            <button
              type="button"
              className="p-2 text-white"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            className="lg:hidden mt-4 pt-4 border-t border-white/10 pb-2 flex flex-col gap-1"
            aria-label="Mobile"
          >
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="py-2 text-sm font-body text-white/65 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <p className="text-[10px] font-body font-bold uppercase tracking-wider text-white/40 mt-2 mb-1">
              Locations
            </p>
            {LOCATIONS.map((loc) => (
              <Link
                key={loc.href}
                href={loc.href}
                className="py-1.5 text-sm font-body text-white/65 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {loc.label}
              </Link>
            ))}
            <Link
              href="/customer/login"
              className="py-2 text-sm font-body text-white/65"
              onClick={() => setMenuOpen(false)}
            >
              Customer Portal
            </Link>
            <Link
              href="/cleaners/apply"
              className="py-2 text-sm font-body text-white/65"
              onClick={() => setMenuOpen(false)}
            >
              Apply as Specialist
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
