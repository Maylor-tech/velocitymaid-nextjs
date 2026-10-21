import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { pageSocialMetadata } from "@/lib/seo/socialImages";
import {
  AREA_CHECK_LABEL,
  NJ_FREE_QUOTE_LABEL,
  VERMONT_HOST_INTAKE_PATH,
  VERMONT_TURNOVER_QUOTE_LABEL,
} from "@/lib/marketing/publicCtas";
import { NJ_LEAD_PATH } from "@/lib/markets/newJersey";

const title = "Check your area | VelocityMaid";
const description =
  "Check whether VelocityMaid covers your Vermont property or New Jersey home, then request a quote.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/estimate" },
  ...pageSocialMetadata({
    title,
    description,
    path: "/estimate",
    image: "default",
  }),
};

const cardClass =
  "rounded-xl border border-vm-border bg-white p-6 text-left shadow-sm transition hover:border-vm-cyan";

export default function EstimatePage() {
  return (
    <div className="min-h-screen bg-vm-surface">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-vm-navy sm:text-4xl">
            {AREA_CHECK_LABEL}
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-body text-base text-vm-muted">
            Pick the market that matches the property. Each form asks only what
            we need for a quote.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link href={VERMONT_HOST_INTAKE_PATH} className={cardClass}>
            <p className="font-body text-xs font-bold uppercase tracking-wider text-vm-cyan-dark">
              Vermont
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold text-vm-navy">
              Hosts and vacation rentals
            </h2>
            <p className="mt-2 font-body text-sm text-vm-muted">
              {VERMONT_TURNOVER_QUOTE_LABEL}
            </p>
          </Link>
          <Link href={NJ_LEAD_PATH} className={cardClass}>
            <p className="font-body text-xs font-bold uppercase tracking-wider text-vm-cyan-dark">
              New Jersey
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold text-vm-navy">
              Homes and apartments
            </h2>
            <p className="mt-2 font-body text-sm text-vm-muted">
              {NJ_FREE_QUOTE_LABEL}
            </p>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
