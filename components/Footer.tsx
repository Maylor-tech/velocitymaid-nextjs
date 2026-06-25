import Link from "next/link";
import { BrandLogo } from "./brand";

/**
 * Footer — institutional pages, unified brand lockup
 */
export default function Footer() {
  return (
    <footer className="border-t border-vm-cyan/10 bg-vm-navy">
      <div className="mx-auto max-w-marketing px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <BrandLogo variant="ivory" size="portal" showTagline={false} />
            <p className="mt-2 text-vm-cyan font-heading uppercase tracking-widest text-xs">
              Come home to clean.
            </p>
            <p className="mt-3 text-sm font-body text-white/60 leading-relaxed">
              Serving New Jersey and Vermont. Trusted since 2024.
            </p>
          </div>
          <div>
            <h4 className={footerHeadingClass}>Resources</h4>
            <ul className="space-y-2 text-sm font-body">
              <li>
                <Link href="/partners" className={footerLinkClass}>
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/investors/materials" className={footerLinkClass}>
                  Investor Materials
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={footerLinkClass}>
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={footerHeadingClass}>Contact</h4>
            <ul className="space-y-2 text-sm font-body">
              <li>
                <a href="tel:+19732809190" className={footerLinkClass}>
                  New Jersey — (973) 280-9190
                </a>
              </li>
              <li>
                <a href="tel:+18027335348" className={footerLinkClass}>
                  Vermont — (802) 733-5348
                </a>
              </li>
              <li>
                <a href="mailto:hello@velocitymaid.com" className={footerLinkClass}>
                  hello@velocitymaid.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-vm-cyan/10 pt-8 text-center text-sm font-body text-white/35">
          <p>&copy; {new Date().getFullYear()} VelocityMaid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

const footerHeadingClass =
  "text-white/50 font-heading text-xs uppercase tracking-widest mb-4";

const footerLinkClass =
  "text-white/70 hover:text-vm-cyan transition-colors";
