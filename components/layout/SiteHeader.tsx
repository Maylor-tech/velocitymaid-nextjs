"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { cn } from "@/lib/utils";

const LOCATIONS = [
  { href: "/new-jersey", label: "New Jersey" },
  { href: "/vermont", label: "Vermont (Overview)" },
  { href: "/vermont/okemo", label: "Okemo Valley" },
  { href: "/vermont/middlebury", label: "Middlebury" },
];

export interface SiteHeaderProps {
  /** Use hash links for homepage sections */
  homeAnchors?: boolean;
  bookingHref?: string;
  bookingLabel?: "Book Now" | "Host Intake" | "Book Cleaning";
}

function isNavActive(href: string, pathname: string): boolean {
  if (href.startsWith("/#")) return false;
  if (href === pathname) return true;
  if (href !== "/" && pathname.startsWith(href)) {
    if (href === "/vermont") return pathname === "/vermont";
    return true;
  }
  return false;
}

const navLinkClass = (active: boolean) =>
  cn(
    "font-body text-sm transition-colors",
    active ? "text-vm-cyan" : "text-white hover:text-vm-cyan"
  );

const ctaClassName =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md btn-tactile transition-[transform,background-color,border-color] duration-150 bg-vm-cyan text-vm-navy font-heading font-semibold uppercase tracking-wider text-xs hover:bg-vm-cyan-dark shadow-md px-4 py-2.5";

export default function SiteHeader({
  homeAnchors = false,
  bookingHref = "/book?branch=new-jersey",
  bookingLabel = "Book Now",
}: SiteHeaderProps) {
  const pathname = usePathname();
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
      className={cn(
        "sticky top-0 z-50 w-full bg-vm-navy border-b border-white/10 transition-all duration-300",
        scrolled ? "shadow-md py-2" : "py-3"
      )}
    >
      <div className="mx-auto max-w-marketing px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0 min-w-0">
            <BrandLogo variant="ivory" size="header" showTagline={false} />
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Main">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={navLinkClass(isNavActive(item.href, pathname))}
              >
                {item.label}
              </Link>
            ))}
            <div className="relative group">
              <button
                type="button"
                className={cn(
                  "font-body text-sm flex items-center gap-1 transition-colors",
                  LOCATIONS.some((loc) => isNavActive(loc.href, pathname))
                    ? "text-vm-cyan"
                    : "text-white hover:text-vm-cyan"
                )}
              >
                Locations
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-vm-navy rounded-lg shadow-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-2">
                  {LOCATIONS.map((loc) => (
                    <Link
                      key={loc.href}
                      href={loc.href}
                      className={cn(
                        "block px-4 py-2 text-sm font-body transition-colors",
                        isNavActive(loc.href, pathname)
                          ? "text-vm-cyan"
                          : "text-white hover:text-vm-cyan hover:bg-white/5"
                      )}
                    >
                      {loc.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/customer/login"
              className={navLinkClass(pathname.startsWith("/customer"))}
            >
              Customer Portal
            </Link>
            <Link href={bookingHref} className={ctaClassName}>
              {bookingLabel}
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link href={bookingHref} className={cn(ctaClassName, "text-[10px] px-3 py-2")}>
              {bookingLabel}
            </Link>
            <button
              type="button"
              className="p-2 text-white hover:text-vm-cyan transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                className={cn("py-2 text-sm font-body", navLinkClass(isNavActive(item.href, pathname)))}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-vm-cyan mt-2 mb-1">
              Locations
            </p>
            {LOCATIONS.map((loc) => (
              <Link
                key={loc.href}
                href={loc.href}
                className={cn(
                  "py-1.5 text-sm font-body",
                  navLinkClass(isNavActive(loc.href, pathname))
                )}
                onClick={() => setMenuOpen(false)}
              >
                {loc.label}
              </Link>
            ))}
            <Link
              href="/customer/login"
              className={cn(
                "py-2 text-sm font-body",
                navLinkClass(pathname.startsWith("/customer"))
              )}
              onClick={() => setMenuOpen(false)}
            >
              Customer Portal
            </Link>
            <Link
              href="/cleaners/apply"
              className="py-2 text-sm font-body text-white hover:text-vm-cyan transition-colors"
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
