import type { Metadata } from "next";
import Link from "next/link";
import {
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { pageSocialMetadata } from "@/lib/seo/socialImages";
import { calcPayout } from "@/lib/payoutRules";
import {
  CLEANER_APPLY_VERMONT_PATH,
  FAST_ESTIMATE_CTA_LABEL,
  FAST_ESTIMATE_PATH,
  VERMONT_WORK_WITH_US_PATH,
} from "@/lib/marketing/publicCtas";
import {
  RECRUITMENT_PAY_HEADING,
  RECRUITMENT_PAY_OFFER_COPY,
  RECRUITMENT_PAY_SCHEDULE_COPY,
} from "@/lib/marketing/recruitmentPayCopy";
import { readVermontFounderVideoEmbed } from "@/lib/marketing/founderVideo";
import { FounderRecruitmentVideo } from "@/components/marketing/FounderRecruitmentVideo";

const title = "Work with us in Vermont | VelocityMaid";
const description =
  "Independent cleaning work in the Okemo Valley and Middlebury. See the job, typical pay, when you get paid, and apply without a phone call.";

export const metadata: Metadata = {
  title,
  description,
  keywords:
    "Vermont cleaner jobs, Okemo Valley cleaning jobs, Ludlow cleaner, Middlebury cleaner jobs, VelocityMaid careers, 1099 cleaner Vermont",
  ...pageSocialMetadata({
    title,
    description,
    path: VERMONT_WORK_WITH_US_PATH,
    image: "vermont",
  }),
};

const HOST_TIERS = [
  { label: "Standard turnover", hostPrice: 225 },
  { label: "Larger home", hostPrice: 275 },
  { label: "Deep / premium", hostPrice: 325 },
] as const;

function usd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

const DAY_STEPS = [
  {
    title: "Accept the job",
    text: RECRUITMENT_PAY_OFFER_COPY,
  },
  {
    title: "Drive and work the checklist",
    text: "Guest-ready standard — not a wipe-down. Expect 30–60 minutes between homes in the same cluster.",
  },
  {
    title: "Photo every job",
    text: "Photos close the work. That is how the host knows it is done and how you get paid.",
  },
  {
    title: "Done in the app",
    text: "Submit the job. Earnings show as ready after we mark it complete. You do not wait for a call to know if you worked.",
  },
] as const;

const FAQS = [
  {
    q: "Is this a job or contract work?",
    a: "Independent contractor (1099). You use your own vehicle. We confirm a W-9 and payment details once, separately from this application. You are responsible for your taxes.",
  },
  {
    q: "How much do I earn?",
    a: `You earn ${RECRUITMENT_PAY_HEADING}. On a typical $${HOST_TIERS[0].hostPrice} guest-ready turnover, that is about ${usd(calcPayout(HOST_TIERS[0].hostPrice).cleanerAmount)}. Larger homes and deep cleans pay more. ${RECRUITMENT_PAY_OFFER_COPY} Tips are extra.`,
  },
  {
    q: "When do I get paid?",
    a: RECRUITMENT_PAY_SCHEDULE_COPY,
  },
  {
    q: "Where do you actually need people?",
    a: "Two clusters: Okemo Valley (Ludlow, Proctorsville, Cavendish, Chester) and Middlebury / Addison County. They are a long drive apart. We hire local to each cluster so two cleans the same day are possible.",
  },
  {
    q: "What do I need to apply?",
    a: "18 or older, authorized to work in the US, a valid driver’s license, and a reliable car. We run a background check. Comfort driving 30–60 minutes in Vermont weather, including ski season. We confirm supplies during onboarding.",
  },
  {
    q: "What happens after I apply?",
    a: "We review applications in 2–3 business days. Strong candidates are invited to the VelocityMaid Certification Program. You will hear from us by email.",
  },
] as const;

export default function VermontWorkWithUsPage() {
  const founderVideo = readVermontFounderVideoEmbed();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: "Vermont Cleaning Specialist",
    description,
    datePosted: "2026-10-07",
    employmentType: "CONTRACTOR",
    hiringOrganization: {
      "@type": "Organization",
      name: "VelocityMaid",
      sameAs: "https://www.velocitymaid.com",
    },
    jobLocation: [
      {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Ludlow",
          addressRegion: "VT",
          addressCountry: "US",
        },
      },
      {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Middlebury",
          addressRegion: "VT",
          addressCountry: "US",
        },
      },
    ],
    applicantLocationRequirements: {
      "@type": "Country",
      name: "US",
    },
    directApply: true,
    url: `https://www.velocitymaid.com${VERMONT_WORK_WITH_US_PATH}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader
        bookingHref={FAST_ESTIMATE_PATH}
        bookingLabel={FAST_ESTIMATE_CTA_LABEL}
      />

      <main>
        <section className="bg-vm-navy px-5 pb-12 pt-10 sm:pb-16 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">
              Vermont · Now hiring
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white sm:text-5xl">
              Work with VelocityMaid in Vermont
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-white/70 sm:text-base">
              Independent cleaning work for guest-ready vacation rentals. This page
              is the job outline — pay, towns, a real day, and how you get paid —
              so you do not need a phone call to decide.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={CLEANER_APPLY_VERMONT_PATH}
                className="inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark"
              >
                Apply for Vermont
              </Link>
              <a
                href="#pay"
                className="inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-white transition hover:border-vm-cyan hover:text-vm-cyan"
              >
                See pay
              </a>
            </div>
            {founderVideo ? (
              <FounderRecruitmentVideo embed={founderVideo} className="mt-8" />
            ) : null}
          </div>
        </section>

        <section className="px-5 py-14" aria-labelledby="the-job-heading">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
              The job
            </p>
            <h2
              id="the-job-heading"
              className="font-heading text-3xl font-bold text-vm-navy"
            >
              Guest-ready work. Your car. Clear payouts.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Car,
                  title: "Independent cleaner",
                  text: "1099 contractor. Valid license, reliable vehicle, and comfort driving Vermont roads — including ski season.",
                },
                {
                  icon: MapPin,
                  title: "30–60 minutes between homes",
                  text: "Jobs stay inside one cluster. We do not expect you to cover Okemo and Middlebury on the same day.",
                },
                {
                  icon: ShieldCheck,
                  title: "Photo every job",
                  text: "A property checklist and photos are the standard. This is hospitality work, not a casual side wipe.",
                },
                {
                  icon: Clock,
                  title: "You choose availability",
                  text: "Accept what you can reach. Same-day turnovers happen in peak season when the route works.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-xl border border-vm-border bg-vm-surface p-5"
                >
                  <Icon className="mb-3 h-5 w-5 text-vm-cyan-dark" aria-hidden />
                  <h3 className="font-heading text-sm font-bold text-vm-navy">
                    {title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-vm-muted">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-vm-surface px-5 py-14" aria-labelledby="where-heading">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
              Where we hire
            </p>
            <h2
              id="where-heading"
              className="font-heading text-3xl font-bold text-vm-navy"
            >
              Two clusters. Not “all of Vermont.”
            </h2>
            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
              Two cleans the same day only work when someone lives near each
              cluster. That is why we hire locally instead of promising statewide
              coverage.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-vm-border bg-white p-6">
                <p className="font-body text-[11px] font-bold uppercase tracking-widest text-vm-cyan-dark">
                  Hiring now
                </p>
                <h3 className="mt-2 font-heading text-xl font-bold text-vm-navy">
                  Okemo Valley
                </h3>
                <p className="mt-2 font-body text-sm text-vm-muted">
                  Ludlow, Proctorsville, Cavendish, Chester, and nearby ski rentals.
                </p>
              </article>
              <article className="rounded-xl border border-vm-border bg-white p-6">
                <p className="font-body text-[11px] font-bold uppercase tracking-widest text-vm-cyan-dark">
                  Hiring now
                </p>
                <h3 className="mt-2 font-heading text-xl font-bold text-vm-navy">
                  Middlebury / Addison
                </h3>
                <p className="mt-2 font-body text-sm text-vm-muted">
                  Middlebury and Addison County vacation homes and second homes.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="pay" className="scroll-mt-24 px-5 py-14" aria-labelledby="pay-heading">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
              Pay
            </p>
            <h2
              id="pay-heading"
              className="font-heading text-3xl font-bold text-vm-navy"
            >
              {RECRUITMENT_PAY_HEADING}
            </h2>
            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
              These examples use published host starting prices as the eligible
              job amount. Offered jobs show the exact payout before you accept.
              Tips are separate and extra.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {HOST_TIERS.map((tier) => {
                const payout = calcPayout(tier.hostPrice);
                return (
                  <article
                    key={tier.label}
                    className="rounded-xl border border-vm-border bg-white p-6"
                  >
                    <h3 className="font-heading text-sm font-bold text-vm-navy">
                      {tier.label}
                    </h3>
                    <p className="mt-3 font-heading text-3xl font-bold text-vm-navy">
                      {usd(payout.cleanerAmount)}
                    </p>
                    <p className="mt-1 font-body text-xs text-vm-muted">
                      Your share on a {usd(tier.hostPrice)} job
                    </p>
                  </article>
                );
              })}
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-vm-border bg-vm-surface p-5">
              <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-vm-cyan-dark" aria-hidden />
              <p className="font-body text-sm leading-relaxed text-vm-text">
                After the job is marked complete, payout is queued and paid on
                Fridays. 1099. W-9 once. You handle taxes. VelocityMaid is
                founder-led and small — the work is real, and so is the pay
                schedule.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-vm-navy px-5 py-14" aria-labelledby="day-heading">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan">
              A real day
            </p>
            <h2
              id="day-heading"
              className="font-heading text-3xl font-bold text-white"
            >
              Accept. Clean. Photo. Paid.
            </h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DAY_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-vm-cyan">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 font-heading text-sm font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 font-body text-xs leading-relaxed text-white/65">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-5 py-14" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl">
            <h2
              id="faq-heading"
              className="font-heading text-3xl font-bold text-vm-navy"
            >
              Questions people ask before they apply
            </h2>
            <div className="mt-8 space-y-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-vm-border bg-white px-5 py-4"
                >
                  <summary className="cursor-pointer list-none font-heading text-sm font-bold text-vm-navy [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {faq.q}
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-vm-cyan-dark opacity-0 group-open:opacity-100"
                        aria-hidden
                      />
                    </span>
                  </summary>
                  <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-vm-surface px-5 py-14 text-center">
          <h2 className="font-heading text-2xl font-bold text-vm-navy sm:text-3xl">
            Ready to apply?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-sm text-vm-muted">
            Takes a few minutes. We reply in 2–3 business days.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={CLEANER_APPLY_VERMONT_PATH}
              className="inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark"
            >
              Apply for Vermont
            </Link>
            <Link
              href="/new-jersey/work-with-us"
              className="inline-flex items-center justify-center rounded-md border border-vm-border px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-white"
            >
              Applying in New Jersey?
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
