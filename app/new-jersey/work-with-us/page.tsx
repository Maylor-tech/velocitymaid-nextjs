import type { Metadata } from "next";
import Link from "next/link";
import { Car, Clock, DollarSign, MapPin, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { pageSocialMetadata } from "@/lib/seo/socialImages";
import {
  RECRUITMENT_PAY_HEADING,
  RECRUITMENT_PAY_OFFER_COPY,
  RECRUITMENT_PAY_SCHEDULE_COPY,
} from "@/lib/marketing/recruitmentPayCopy";
import { NJ_SERVICE_CITIES } from "@/lib/markets/newJersey";
import {
  CLEANER_APPLY_NJ_PATH,
  FAST_ESTIMATE_CTA_LABEL,
  FAST_ESTIMATE_PATH,
  NJ_WORK_WITH_US_PATH,
  VERMONT_WORK_WITH_US_PATH,
} from "@/lib/marketing/publicCtas";

const title = "Work with us in New Jersey | VelocityMaid";
const description =
  "Independent cleaning work in Bloomfield, Montclair, Newark, and nearby towns. See how pay works, then apply.";

export const metadata: Metadata = {
  title,
  description,
  ...pageSocialMetadata({
    title,
    description,
    path: NJ_WORK_WITH_US_PATH,
    image: "default",
  }),
};

export default function NewJerseyWorkWithUsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader
        bookingHref={FAST_ESTIMATE_PATH}
        bookingLabel={FAST_ESTIMATE_CTA_LABEL}
      />
      <main>
        <section className="bg-vm-navy px-5 pb-12 pt-10 sm:pb-16 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">
              New Jersey · Now hiring
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white sm:text-5xl">
              Work with VelocityMaid in New Jersey
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-white/70 sm:text-base">
              Independent contractor work for recurring homes and deep cleans.
              You earn {RECRUITMENT_PAY_HEADING}. Offered jobs show your payout
              before you accept. We pay on Fridays after the job is marked
              complete.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={CLEANER_APPLY_NJ_PATH}
                className="inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark"
              >
                Apply for New Jersey
              </Link>
              <Link
                href={VERMONT_WORK_WITH_US_PATH}
                className="inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-white transition hover:border-vm-cyan hover:text-vm-cyan"
              >
                Vermont instead?
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-14">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
            {[
              {
                icon: DollarSign,
                title: RECRUITMENT_PAY_HEADING,
                text: `New Jersey jobs are quoted per home. ${RECRUITMENT_PAY_OFFER_COPY} Tips are extra. 1099 — W-9 once.`,
              },
              {
                icon: Clock,
                title: "Paid on Fridays",
                text: RECRUITMENT_PAY_SCHEDULE_COPY,
              },
              {
                icon: Car,
                title: "Your car, local routes",
                text: "License, reliable transport, background check. Work stays in this New Jersey service area.",
              },
              {
                icon: ShieldCheck,
                title: "Photo every job",
                text: "Hospitality standard. Photos close the work so the customer can pay without a phone call.",
              },
            ].map(({ icon: Icon, title: heading, text }) => (
              <article
                key={heading}
                className="rounded-xl border border-vm-border bg-vm-surface p-5"
              >
                <Icon className="mb-3 h-5 w-5 text-vm-cyan-dark" aria-hidden />
                <h2 className="font-heading text-sm font-bold text-vm-navy">
                  {heading}
                </h2>
                <p className="mt-2 font-body text-sm leading-relaxed text-vm-muted">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-vm-surface px-5 py-14">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
              Where we hire
            </p>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">
              New Jersey towns we cover
            </h2>
            <p className="mt-4 flex items-start gap-2 font-body text-sm text-vm-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-vm-cyan-dark" />
              {NJ_SERVICE_CITIES.join(" · ")}
            </p>
          </div>
        </section>

        <section className="px-5 py-14 text-center">
          <Link
            href={CLEANER_APPLY_NJ_PATH}
            className="inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark"
          >
            Apply for New Jersey
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
