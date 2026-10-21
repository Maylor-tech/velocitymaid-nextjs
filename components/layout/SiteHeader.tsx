"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { cn } from "@/lib/utils";
import {
  HEADER_QUOTE_LABEL,
  NJ_FREE_QUOTE_LABEL,
  VERMONT_HOST_INTAKE_PATH,
  VERMONT_TURNOVER_QUOTE_LABEL,
} from "@/lib/marketing/publicCtas";
import { NJ_LEAD_PATH } from "@/lib/markets/newJersey";

const LOCATIONS = [
  { href: "/new-jersey", label: "New Jersey" },
  { href: "/vermont", label: "Vermont" },
  { href: "/vermont/okemo", label: "Okemo Valley" },
  { href: "/vermont/middlebury", label: "Middlebury" },
];

const NAV_LINKS = [
  { href: "/hosts", label: "Vermont Hosts" },
  { href: NJ_LEAD_PATH, label: "NJ Homes" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gallery", label: "Our Work" },
  { href: "/contact", label: "Contact" },
] as const;

const QUOTE_CHOICES = [
  {
    href: VERMONT_HOST_INTAKE_PATH,
    label: `Vermont host — ${VERMONT_TURNOVER_QUOTE_LABEL}`,
  },
  {
    href: NJ_LEAD_PATH,
    label: `New Jersey home — ${NJ_FREE_QUOTE_LABEL}`,
  },
] as const;

export interface SiteHeaderProps {
  /** Kept so existing pages compile. Navigation is the same on every page. */
  homeAnchors?: boolean;
  bookingHref?: string;
  bookingLabel?: string;
}

function isNavActive(href: string, pathname: string): boolean {
  if (href === pathname) return true;
  if (href === "/hosts" && pathname.startsWith("/vermont")) return false;
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

export default function SiteHeader(props: SiteHeaderProps) {
  void props;
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-vm-navy border-b border-white/10 transition-all duration-300",
        scrolled ? "shadow-md py-2" : "py-3"
      )}
    >
      <div className="mx-auto max-w-marketing px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0 min-w-0" aria-label="VelocityMaid home">
            <BrandLogo
              theme="dark"
              size="header"
              showTagline={false}
              responsiveMark
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Main">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
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
                aria-haspopup="true"
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
            <div className="relative">
              <button
                type="button"
                className={ctaClassName}
                aria-expanded={quoteOpen}
                aria-haspopup="true"
                onClick={() => setQuoteOpen((open) => !open)}
              >
                {HEADER_QUOTE_LABEL}
              </button>
              {quoteOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-white/10 bg-vm-navy p-2 shadow-lg">
                  {QUOTE_CHOICES.map((choice) => (
                    <Link
                      key={choice.href}
                      href={choice.href}
                      className="block rounded-md px-3 py-2 font-body text-sm text-white hover:bg-white/5 hover:text-vm-cyan"
                      onClick={() => setQuoteOpen(false)}
                    >
                      {choice.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              className={cn(ctaClassName, "text-[10px] px-3 py-2")}
              aria-expanded={quoteOpen}
              onClick={() => setQuoteOpen((open) => !open)}
            >
              {HEADER_QUOTE_LABEL}
            </button>
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

        {quoteOpen ? (
          <div className="lg:hidden mt-3 rounded-lg border border-white/10 bg-white/5 p-2">
            {QUOTE_CHOICES.map((choice) => (
              <Link
                key={choice.href}
                href={choice.href}
                className="block rounded-md px-3 py-2 font-body text-sm text-white hover:text-vm-cyan"
                onClick={() => setQuoteOpen(false)}
              >
                {choice.label}
              </Link>
            ))}
          </div>
        ) : null}

        {menuOpen && (
          <nav
            className="lg:hidden mt-4 pt-4 border-t border-white/10 pb-2 flex flex-col gap-1"
            aria-label="Mobile"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
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
          </nav>
        )}
      </div>
    </header>
  );
}
