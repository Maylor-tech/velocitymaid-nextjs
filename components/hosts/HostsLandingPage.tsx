"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { AfterTheClean } from "@/components/marketing/AfterTheClean";
import { HomeWatchLinkCard } from "@/components/marketing/HomeWatchLinkCard";
import { MarketingTestimonials } from "@/components/marketing/MarketingTestimonials";
import { VERMONT_TESTIMONIALS } from "@/lib/marketing/testimonials";
import { trackEvent } from "@/lib/analytics/trackEvent";
import {
  VERMONT_HOST_INTAKE_PATH,
  VERMONT_TURNOVER_QUOTE_LABEL,
} from "@/lib/marketing/publicCtas";
import {
  attributionAnalyticsParams,
  mergeAttributionFirstTouch,
  parseAttributionFromSearchParams,
  readStoredAttribution,
  writeStoredAttribution,
} from "@/lib/hostIntake/attribution";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";

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

export function HostsLandingPage() {
  function trackCta(cta: string) {
    const dims = attributionAnalyticsParams(readStoredAttribution());
    trackEvent("hosts_cta_click", { ...dims, cta });
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <Suspense fallback={null}>
        <HostsAnalyticsBootstrap />
      </Suspense>
      <main>
        <section className="bg-vm-navy px-5 pb-12 pt-10 text-center sm:pb-16 sm:pt-14">
          <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">
            Vermont hosts and property managers
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-heading text-3xl font-bold leading-tight text-white sm:text-5xl">
            YOUR PROPERTY.{" "}
            <span className="text-vm-cyan">GUEST-READY.</span> EVERY TIME.
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-white/65 sm:text-base">
            Documented turnovers and property-specific standards for Vermont vacation
            rentals—so the next guest arrives to a home that feels ready.
          </p>
        </section>

        <AfterTheClean />

        <section className="bg-white px-5 py-10">
          <div className="mx-auto max-w-3xl">
            <HomeWatchLinkCard />
          </div>
        </section>

        <MarketingTestimonials
          testimonials={VERMONT_TESTIMONIALS}
          title="From a Vermont host"
          subtitle="Feedback after a guest-ready turnover."
        />

        <section
          id="setup-request"
          className="scroll-mt-20 bg-vm-navy px-5 py-14 text-center"
        >
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-sm text-white/65">
            Start with the property. We reply with the next step.
          </p>
          <div className="mt-7">
            <Link
              href={VERMONT_HOST_INTAKE_PATH}
              className={primaryButton}
              onClick={() => trackCta("final_turnover_quote")}
            >
              {VERMONT_TURNOVER_QUOTE_LABEL}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
