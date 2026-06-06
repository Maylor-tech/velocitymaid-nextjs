import Link from "next/link";
import { BrandLogo } from "./brand";

/**
 * Footer — institutional pages, unified brand lockup
 */
export default function Footer() {
  return (
    <footer className="border-t border-brand-forest/10 bg-brand-ivory">
      <div className="mx-auto max-w-marketing px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <BrandLogo size="sm" />
            <p className="mt-3 text-sm font-sans font-medium text-brand-slate/80 leading-relaxed">
              Hospitality-level standards for primary estates and care programs.
            </p>
          </div>
          <div>
            <h4 className={footerHeadingClass}>Resources</h4>
            <ul className="mt-2 space-y-2 text-sm font-sans font-medium text-brand-slate/80">
              <li>
                <Link href="/partners" className="hover:text-brand-forest">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/investors/materials" className="hover:text-brand-forest">
                  Investor Materials
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-brand-forest">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={footerHeadingClass}>Contact</h4>
            <ul className="mt-2 space-y-2 text-sm font-sans font-medium text-brand-slate/80">
              <li>
                <a href="mailto:hello@velocitymaid.com" className="hover:text-brand-forest">
                  hello@velocitymaid.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-brand-forest/10 pt-8 text-center text-sm font-sans text-brand-slate/60">
          <p>&copy; {new Date().getFullYear()} VelocityMaid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

const footerHeadingClass =
  "text-xs font-sans font-bold uppercase tracking-wider text-brand-forest";
