import Link from "next/link";
import { BrandLogo } from "./brand";
import {
  SUPPORT_EMAIL,
  VERMONT_SUPPORT,
  VERMONT_WHATSAPP_URL,
} from '@/lib/customer/marketSupport';
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
                <a href={`mailto:${SUPPORT_EMAIL}`} className={footerLinkClass}>
                  New Jersey — {SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <a href={`tel:+1${VERMONT_SUPPORT.phoneTel}`} className={footerLinkClass}>
                  Vermont — {VERMONT_SUPPORT.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={VERMONT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                  Vermont WhatsApp
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
