"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck,
  Home,
  ShieldCheck,
} from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { GuestReadyProcess } from "@/components/marketing/GuestReadyProcess";
import { MarketingTestimonials } from "@/components/marketing/MarketingTestimonials";
import { HostSetupRequestForm } from "@/components/hosts/HostSetupRequestForm";
import { VERMONT_TESTIMONIALS } from "@/lib/marketing/testimonials";
import { VERMONT_SUPPORT } from "@/lib/customer/marketSupport";
import { trackEvent } from "@/lib/analytics/trackEvent";
import {
  attributionAnalyticsParams,
  mergeAttributionFirstTouch,
  parseAttributionFromSearchParams,
  readStoredAttribution,
  writeStoredAttribution,
} from "@/lib/hostIntake/attribution";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";
const outlineButton =
  "inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-white transition hover:border-vm-cyan hover:text-vm-cyan";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
      {children}
    </p>
  );
}

function HostsAnalyticsBootstrap() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromUrl = parseAttributionFromSearchParams(searchParams, {
      landing: "/hosts",
    });
    const withLanding = {
      ...fromUrl,
      landing: "/hosts" as const,
      first_touch_at: fromUrl.first_touch_at || new Date().toISOString(),
    };
    const merged = mergeAttributionFirstTouch(
      readStoredAttribution(),
      withLanding
    );
    writeStoredAttribution(merged);
    trackEvent("hosts_landing_view", attributionAnalyticsParams(merged));
  }, [searchParams]);

  return null;
}

function TrustStrip() {
  const values = [
    { title: "Reliable Turnovers", text: "Built around guest checkout windows", icon: Clock3 },
    {
      title: "Property-Specific Systems",
      text: "Checklists tailored to each home",
      icon: FileCheck,
    },
    {
      title: "Photo-Backed QC",
      text: "Completion checks before guest arrival",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="border-b border-vm-border bg-white" aria-label="Trust signals">
      <div className="mx-auto grid max-w-marketing grid-cols-1 sm:grid-cols-3">
        {values.map(({ title, text, icon: Icon }) => (
          <div
            key={title}
            className="border-b border-vm-border p-5 text-center last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-7"
          >
            <span className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-vm-cyan-tint">
              <Icon className="h-4 w-4 text-vm-cyan-dark" aria-hidden />
            </span>
            <h2 className="font-heading text-sm font-bold text-vm-navy">{title}</h2>
            <p className="mt-1 font-body text-xs leading-relaxed text-vm-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesSection() {
  const services = [
    {
      title: "Vacation rental turnovers",
      text: "Guest-ready resets planned around checkout and check-in windows.",
      icon: Home,
    },
    {
      title: "Deep cleaning and property resets",
      text: "Seasonal and first-time cleans when a property needs a fuller reset.",
      icon: CheckCircle2,
    },
    {
      title: "Guest-ready inspections",
      text: "Completion checks and documentation before the next arrival.",
      icon: ClipboardList,
    },
  ];

  return (
    <section className="bg-vm-surface px-5 py-14" aria-labelledby="hosts-services-heading">
      <div className="mx-auto max-w-5xl text-center">
        <Eyebrow>Vermont hosts</Eyebrow>
        <h2
          id="hosts-services-heading"
          className="font-heading text-3xl font-bold text-vm-navy"
        >
          Turnover support for vacation rentals
        </h2>
        <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
          We help Vermont hosts keep properties guest-ready between stays through
          documented turnovers, property-specific standards, and local operational support.
        </p>
        <div className="mt-9 grid gap-4 text-left sm:grid-cols-3">
          {services.map(({ title, text, icon: Icon }) => (
            <article
              key={title}
              className="rounded-xl border border-vm-border bg-white p-5"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-vm-cyan-tint">
                <Icon className="h-4 w-4 text-vm-cyan-dark" aria-hidden />
              </span>
              <h3 className="font-heading text-base font-bold text-vm-navy">{title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-vm-muted">
                {text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChecklistSection() {
  const points = [
    {
      title: "Property profile",
      text: "Each home gets a clear checklist tailored to rooms, amenities, and host preferences.",
    },
    {
      title: "Service standard",
      text: "We review your property, schedule, and guest standards before service begins.",
    },
    {
      title: "Host communication",
      text: "You receive clear updates—and property observations that help the next arrival go smoothly.",
    },
  ];

  return (
    <section className="bg-white px-5 py-14" aria-labelledby="hosts-checklist-heading">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <Eyebrow>Property systems</Eyebrow>
          <h2
            id="hosts-checklist-heading"
            className="font-heading text-3xl font-bold text-vm-navy"
          >
            More Than a Cleaning Checklist
          </h2>
          <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
            A guest-ready turnover system—not a one-off clean. Property-specific
            standards keep results consistent from stay to stay.
          </p>
        </div>
        <ul className="mt-9 grid gap-4 sm:grid-cols-3">
          {points.map((point) => (
            <li
              key={point.title}
              className="rounded-xl border border-vm-border bg-vm-surface p-5"
            >
              <h3 className="font-heading text-base font-bold text-vm-navy">
                {point.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-vm-muted">
                {point.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function QualitySection() {
  const items = [
    {
      title: "Reliable Scheduling",
      text: "Arrival windows planned around guest turnovers.",
      icon: CalendarDays,
    },
    {
      title: "Guest-Ready Checks",
      text: "Inspected before completion.",
      icon: ShieldCheck,
    },
    {
      title: "Host Communication",
      text: "Direct updates, no guesswork.",
      icon: Home,
    },
  ];

  return (
    <section className="bg-vm-navy px-5 py-14" aria-labelledby="hosts-quality-heading">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan">
          Quality &amp; accountability
        </p>
        <h2
          id="hosts-quality-heading"
          className="font-heading text-3xl font-bold text-white"
        >
          Clear expectations. Documented results.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-white/65">
          Completion checks and documentation help keep results consistent from stay
          to stay.
        </p>
        <div className="mt-9 grid gap-4 text-left sm:grid-cols-3">
          {items.map(({ title, text, icon: Icon }) => (
            <article
              key={title}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <Icon className="mb-3 h-5 w-5 text-vm-cyan" aria-hidden />
              <h3 className="font-heading text-sm font-bold text-white">{title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-white/65">
                {text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HostsLandingPage() {
  const phoneHref = `tel:+1${VERMONT_SUPPORT.phoneTel}`;

  function trackCta(cta: string) {
    const dims = attributionAnalyticsParams(readStoredAttribution());
    trackEvent("hosts_cta_click", { ...dims, cta });
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader bookingHref="#setup-request" bookingLabel="Request a Quote" />
      <Suspense fallback={null}>
        <HostsAnalyticsBootstrap />
      </Suspense>
      <main>
        <section className="bg-vm-navy px-5 pb-12 pt-10 text-center sm:pb-16 sm:pt-14">
          <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">
            Vermont hosts &amp; property managers
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-heading text-3xl font-bold leading-tight text-white sm:text-5xl">
            YOUR PROPERTY.{" "}
            <span className="text-vm-cyan">GUEST-READY.</span> EVERY TIME.
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-white/65 sm:text-base">
            Documented turnovers and property-specific standards for Vermont vacation
            rentals—so the next guest arrives to a home that feels ready.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#setup-request"
              className={primaryButton}
              onClick={() => trackCta("hero_request_setup")}
            >
              Request Property Setup
            </a>
            <a href={phoneHref} className={outlineButton}>
              Call {VERMONT_SUPPORT.phoneDisplay}
            </a>
          </div>
        </section>

        <TrustStrip />
        <GuestReadyProcess tone="light" />
        <ServicesSection />
        <ChecklistSection />
        <QualitySection />

        <MarketingTestimonials
          testimonials={VERMONT_TESTIMONIALS}
          title="From a Vermont host"
          subtitle="Feedback after a guest-ready turnover."
        />

        <section
          id="setup-request"
          className="scroll-mt-20 bg-vm-surface px-5 py-14"
          aria-labelledby="setup-request-heading"
        >
          <div className="mx-auto max-w-xl">
            <div className="mb-7 text-center">
              <Eyebrow>Start here</Eyebrow>
              <h2
                id="setup-request-heading"
                className="font-heading text-3xl font-bold text-vm-navy"
              >
                Request Property Setup
              </h2>
              <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-vm-muted">
                Share a few details. We&apos;ll follow up—no full operational intake
                required on this first step.
              </p>
            </div>
            <Suspense
              fallback={
                <div className="rounded-xl border border-vm-border bg-white p-6 text-center font-body text-sm text-vm-muted">
                  Loading form…
                </div>
              }
            >
              <HostSetupRequestForm />
            </Suspense>
          </div>
        </section>

        <section className="bg-vm-navy px-5 py-14 text-center">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-sm text-white/65">
            Request property setup or call us directly for Vermont turnover support.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#setup-request"
              className={primaryButton}
              onClick={() => trackCta("final_request_setup")}
            >
              Request Property Setup
            </a>
            <a href={phoneHref} className={outlineButton}>
              Call {VERMONT_SUPPORT.phoneDisplay}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
