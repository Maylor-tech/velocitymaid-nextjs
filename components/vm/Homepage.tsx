import Link from "next/link";
import { reviews } from "@/lib/marketing/reviews";
import { TrustStrip } from "./TrustStrip";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { StatusPill } from "./StatusPill";
import { vmFocusRing } from "./focus";
import { cn } from "@/lib/utils";

const VT_INTAKE = "/vermont/host-intake";
const NJ_BOOK = "/book?branch=new-jersey";
const QUOTE_ANCHOR = "/#choose-your-area";

/**
 * Hide placeholder media until real assets ship.
 * Never render bracketed placeholder copy when false.
 */
const SHOW_PLACEHOLDER_MEDIA = false;

const headingH2 =
  "font-heading text-4xl font-bold leading-[1.2] tracking-tight text-vm-navy";
const headingH3 =
  "font-heading font-bold leading-[1.2] tracking-tight text-vm-navy";

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-vm-cyan"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z"
        fill="currentColor"
        className="text-vm-navy"
      />
    </svg>
  );
}

const ctaAccent = cn(
  "inline-flex min-h-touch items-center justify-center rounded-vm-md bg-vm-cyan px-5 py-3.5 font-heading text-sm font-bold tracking-tight text-vm-navy hover:bg-vm-cyan/90",
  vmFocusRing
);

const ctaWhite = cn(
  "inline-flex min-h-touch items-center justify-center rounded-vm-md bg-vm-white px-5 py-3.5 font-heading text-sm font-bold tracking-tight text-vm-navy hover:bg-vm-white/90",
  vmFocusRing
);

const ctaNavy = cn(
  "inline-flex min-h-touch items-center justify-center rounded-vm-md bg-vm-navy px-5 py-3 font-heading text-sm font-bold tracking-tight text-vm-white hover:bg-vm-navy/90",
  vmFocusRing
);

/**
 * Public homepage — rebuilt from reference/homepage.html + CURSOR_HANDOFF §5 (v1.1).
 * Uses components/vm/* only. Does not alter other routes.
 */
export function Homepage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-vm-canvas font-body text-base leading-relaxed text-vm-text">
      <TrustStrip />
      <SiteHeader quoteHref={QUOTE_ANCHOR} className="max-w-none" />

      {/* 5.3 Hero */}
      <section className="bg-vm-navy text-vm-white">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <p className="mb-4 text-[13px] font-bold tracking-[0.13em] text-vm-cyan">
              VERMONT · NEW JERSEY
            </p>
            <h1 className="font-heading text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.04] tracking-[-0.03em]">
              A hotel-standard clean. Photo proof every time.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-vm-nav-text">
              Vacation-rental turnovers and home cleaning, run by a 13-year
              hospitality veteran. You see every room before you pay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={VT_INTAKE} className={ctaAccent}>
                I host in Vermont →
              </Link>
              <Link href={NJ_BOOK} className={ctaWhite}>
                Clean my home in NJ →
              </Link>
            </div>
            <ul className="mt-7 flex list-none flex-wrap gap-x-5 gap-y-2.5 p-0 text-sm text-vm-nav-text">
              <li className="flex items-center gap-2">
                <CheckIcon /> Insured
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Background-checked team
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Re-clean guarantee
              </li>
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[460px] justify-self-center lg:justify-self-end">
            <div className="flex flex-col gap-3.5 rounded-vm-xl bg-vm-white p-6 text-vm-text shadow-vm-dialog">
              <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between min-[480px]:gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold tracking-wide text-vm-cyan-dark">
                    TURNOVER REPORT · EXAMPLE
                  </div>
                  <div className="font-heading text-[22px] font-bold leading-[1.2] tracking-tight text-vm-navy">
                    Lakeside cabin · Sat
                  </div>
                </div>
                <StatusPill tone="success" className="self-start">
                  QC approved
                </StatusPill>
              </div>
              {SHOW_PLACEHOLDER_MEDIA ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {["Kitchen photo", "Bath photo", "Bedroom photo"].map(
                    (label) => (
                      <div
                        key={label}
                        className="grid aspect-[4/3] place-items-center rounded-vm-sm bg-vm-line text-[11px] text-vm-muted"
                      >
                        {label}
                      </div>
                    )
                  )}
                </div>
              ) : null}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between border-b border-vm-line pb-2">
                  <span className="text-vm-muted">Checklist</span>
                  <strong>32 of 32 done</strong>
                </div>
                <div className="flex justify-between border-b border-vm-line pb-2">
                  <span className="text-vm-muted">Flagged for you</span>
                  <strong>Paper towels low</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-vm-muted">Guest-ready</span>
                  <strong>2:40 pm</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.4 Choose your area */}
      <section
        id="choose-your-area"
        className="mx-auto max-w-[1200px] px-4 pb-6 pt-16 sm:px-6 sm:pt-20"
      >
        <h2 className={headingH2}>Choose your area</h2>
        <p className="mt-2 text-[17px] text-vm-text">
          Two markets, two ways to book. Pick yours and you&apos;re one form
          away.
        </p>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <article className="flex flex-col gap-3.5 rounded-vm-xl border border-vm-line bg-vm-white p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className={cn(headingH3, "text-[28px]")}>Vermont hosts</h3>
              <a
                href="tel:+18027335348"
                className={cn(
                  "font-bold text-vm-cyan-dark hover:text-vm-navy",
                  vmFocusRing
                )}
              >
                (802) 733-5348
              </a>
            </div>
            <p className="text-vm-muted">
              Turnovers between check-out and check-in, from $225. Deep cleans,
              post-construction cleans and residential cleaning by quote.
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-vm-text">
              <li>Beds made, linens reset, kitchen and baths guest-ready</li>
              <li>Photo report after QC, before you&apos;re invoiced</li>
              <li>We flag damage and low supplies we find</li>
            </ul>
            <Link href={VT_INTAKE} className={cn(ctaAccent, "mt-1.5 self-start")}>
              Start host intake →
            </Link>
            <p className="text-[13px] text-vm-muted">
              Invoiced after the clean passes QC.
            </p>
          </article>

          <article className="flex flex-col gap-3.5 rounded-vm-xl border border-vm-line bg-vm-white p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className={cn(headingH3, "text-[28px]")}>New Jersey homes</h3>
              <a
                href="tel:+19732809190"
                className={cn(
                  "font-bold text-vm-cyan-dark hover:text-vm-navy",
                  vmFocusRing
                )}
              >
                (973) 280-9190
              </a>
            </div>
            <p className="text-vm-muted">
              Recurring and one-time home cleaning, deep cleans and move-outs.
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-vm-text">
              <li>Same checklist and photo report as our rentals</li>
              <li>Choose your date and pay securely online</li>
              <li>Re-clean guarantee on every visit</li>
            </ul>
            <Link href={NJ_BOOK} className={cn(ctaNavy, "mt-1.5 self-start")}>
              Book in New Jersey →
            </Link>
            <p className="text-[13px] text-vm-muted">
              Pay online when you book. Price confirmed before you pay.
            </p>
          </article>
        </div>
      </section>

      {/* 5.5 What happens on every clean */}
      <section
        id="how-it-works"
        className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6"
      >
        <h2 className={headingH2}>What happens on every clean</h2>
        <p className="mt-2 text-[17px] text-vm-text">
          No guessing whether it got done. You get the evidence.
        </p>
        <ol className="mt-7 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "01",
              title: "Room-by-room checklist",
              body: "Built for your property, followed on every visit.",
            },
            {
              n: "02",
              title: "Before and after photos",
              body: "Taken by your cleaner as each room is finished.",
            },
            {
              n: "03",
              title: "Quality check",
              body: "We review the photos before anything reaches you.",
            },
            {
              n: "04",
              title: "Your report, then the invoice",
              body: "See the work first. Damage and low supplies are flagged.",
            },
          ].map((step) => (
            <li
              key={step.n}
              className="rounded-vm-lg border border-vm-line bg-vm-white p-6"
            >
              <span className="font-heading text-4xl font-bold text-vm-cyan-dark">
                {step.n}
              </span>
              <h3 className={cn(headingH3, "mt-1.5 text-[17px]")}>
                {step.title}
              </h3>
              <p className="mt-1 text-[15px] text-vm-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 5.6 Founder — photo hidden while SHOW_PLACEHOLDER_MEDIA is false */}
      <section
        id="why-we-clean"
        className="border-y border-vm-line bg-vm-white"
      >
        <div
          className={cn(
            "mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 sm:px-6",
            SHOW_PLACEHOLDER_MEDIA && "lg:grid-cols-2 lg:gap-12"
          )}
        >
          {SHOW_PLACEHOLDER_MEDIA ? (
            <div className="grid aspect-[4/5] max-w-[420px] place-items-center rounded-vm-xl bg-vm-line text-sm text-vm-muted">
              {/* Real founder photo only — never ship bracketed placeholder text */}
            </div>
          ) : null}
          <div className="min-w-0 max-w-3xl">
            <p className="mb-3 text-[13px] font-bold tracking-[0.13em] text-vm-cyan-dark">
              WHY WE CLEAN LIKE THIS
            </p>
            <h2 className={cn(headingH2, "leading-[1.2]")}>
              Thirteen years of hospitality, in every room.
            </h2>
            <p className="mt-4 text-[17px] text-vm-text">
              Before VelocityMaid, founder Brian Bruce Maylor spent 13 years
              with Royal Caribbean, in the galley and as a dining room lead,
              where a room has to be guest-ready on a deadline, every time.
              That&apos;s the standard we bring to your property: a checklist, a
              clock, and someone checking the work.
            </p>
            <p className="mt-4 font-semibold text-vm-navy">
              — Brian Bruce Maylor, Founder
            </p>
          </div>
        </div>
      </section>

      {/* 5.7 Reviews */}
      {reviews.length > 0 ? (
        <section className="mx-auto max-w-[1200px] px-4 pb-6 pt-16 sm:px-6">
          <h2 className={cn(headingH2, "mb-7")}>What our clients say</h2>
          <div className="flex flex-col gap-5">
            {reviews.map((review) => {
              const showGoogleLink =
                Boolean(review.sourceUrl) &&
                review.sourceUrl !== "#" &&
                review.sourceUrl.trim() !== "";
              return (
                <figure
                  key={`${review.name}-${review.quote.slice(0, 24)}`}
                  className="grid items-center gap-8 rounded-vm-xl border border-vm-line bg-vm-white p-8 md:grid-cols-2 md:p-10"
                >
                  <blockquote className="m-0 font-heading text-[clamp(1.25rem,3vw,1.625rem)] font-medium leading-[1.35] tracking-tight text-vm-navy">
                    “{review.quote}”
                  </blockquote>
                  <figcaption className="flex flex-col gap-2.5">
                    {review.secondQuote ? (
                      <p className="m-0 text-base text-vm-text">
                        “{review.secondQuote}”
                      </p>
                    ) : null}
                    <div
                      className="flex gap-0.5 text-vm-navy"
                      role="img"
                      aria-label={`${review.stars} out of 5 stars`}
                    >
                      {Array.from({ length: review.stars }).map((_, i) => (
                        <StarIcon key={i} />
                      ))}
                    </div>
                    <div>
                      <strong className="text-vm-navy">{review.name}</strong>
                      <div className="text-sm text-vm-muted">
                        {review.context}
                      </div>
                    </div>
                    {showGoogleLink ? (
                      <a
                        href={review.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "text-sm font-bold text-vm-cyan-dark hover:text-vm-navy",
                          vmFocusRing
                        )}
                      >
                        Read the full review on Google →
                      </a>
                    ) : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 5.8 Guarantee */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-vm-xl border border-vm-cyan-border bg-vm-cyan-tint p-8">
          <div className="max-w-xl">
            <h2 className="font-heading text-[28px] font-bold leading-[1.2] tracking-tight text-vm-navy">
              Our re-clean guarantee
            </h2>
            <p className="mt-1.5 text-vm-text">
              If we missed something, tell us within 24 hours and we&apos;ll
              come back and fix it, free.
            </p>
          </div>
          <Link href={QUOTE_ANCHOR} className={ctaNavy}>
            Get a quote
          </Link>
        </div>
      </section>

      {/* 5.9 FAQ */}
      <section className="mx-auto max-w-[860px] px-4 pb-16 pt-6 sm:px-6">
        <h2 className={cn(headingH2, "mb-5")}>Questions</h2>
        <div className="flex flex-col gap-2.5">
          <details
            className="rounded-vm-md border border-vm-line bg-vm-white px-5 py-4"
            open
          >
            <summary className="cursor-pointer font-bold text-vm-navy">
              Are you insured, and who will be in my home?
            </summary>
            <p className="mt-2.5 text-vm-text">
              Yes, we&apos;re insured, and every cleaner is background-checked
              before their first job.
            </p>
          </details>
          <details className="rounded-vm-md border border-vm-line bg-vm-white px-5 py-4">
            <summary className="cursor-pointer font-bold text-vm-navy">
              What if something is missed?
            </summary>
            <p className="mt-2.5 text-vm-text">
              Tell us within 24 hours and we&apos;ll come back and fix it, free.
            </p>
          </details>
          <details className="rounded-vm-md border border-vm-line bg-vm-white px-5 py-4">
            <summary className="cursor-pointer font-bold text-vm-navy">
              How do I pay?
            </summary>
            <p className="mt-2.5 text-vm-text">
              Vermont hosts are invoiced after the clean passes QC. New Jersey
              homes pay securely online when booking.
            </p>
          </details>
          <details className="rounded-vm-md border border-vm-line bg-vm-white px-5 py-4">
            <summary className="cursor-pointer font-bold text-vm-navy">
              Can you sync with my Airbnb or VRBO calendar?
            </summary>
            <p className="mt-2.5 text-vm-text">
              Calendar sync is coming soon. Until then, we schedule turnovers
              from your booking list.
            </p>
          </details>
        </div>
      </section>

      {/* 5.10 Closing CTA */}
      <section className="bg-vm-navy text-vm-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-4 py-16 sm:px-6">
          <h2 className="m-0 font-heading text-[clamp(2rem,4vw,2.5rem)] font-bold leading-[1.2] tracking-[-0.03em]">
            Come home to clean.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href={VT_INTAKE} className={ctaAccent}>
              I host in Vermont →
            </Link>
            <Link href={NJ_BOOK} className={ctaWhite}>
              Clean my home in NJ →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export default Homepage;
