"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { AfterTheClean } from "@/components/marketing/AfterTheClean";
import { ResidentialIntakeForm } from "@/components/residential/ResidentialIntakeForm";
import { VERMONT_SUPPORT } from "@/lib/customer/marketSupport";
import { VERMONT_HOST_INTAKE_PATH } from "@/lib/marketing/publicCtas";
import {
  mergeAttributionFirstTouch,
  parseAttributionFromSearchParams,
  readStoredResidentialAttribution,
  writeStoredResidentialAttribution,
} from "@/lib/hostIntake/attribution";

function ResidentialAnalyticsBootstrap() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromUrl = parseAttributionFromSearchParams(searchParams, {
      landing: "/residential",
    });
    const withLanding = {
      ...fromUrl,
      landing: "/residential",
      first_touch_at: fromUrl.first_touch_at || new Date().toISOString(),
    };
    writeStoredResidentialAttribution(
      mergeAttributionFirstTouch(readStoredResidentialAttribution(), withLanding)
    );
  }, [searchParams]);

  return null;
}

export function ResidentialLandingPage() {
  return (
    <div className="min-h-screen bg-vm-white">
      <SiteHeader />
      <Suspense fallback={null}>
        <ResidentialAnalyticsBootstrap />
      </Suspense>

      <section className="bg-vm-navy px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan">
            Vermont homes
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
            Residential cleaning for homeowners, tenants, and landlords
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-white/75 sm:text-base">
            One-time, recurring, deep, and move-in/move-out cleaning. Tell us
            about the home and we will confirm scope and pricing before work
            begins.{" "}
            <Link href={VERMONT_HOST_INTAKE_PATH} className="text-vm-cyan underline-offset-2 hover:underline">
              Hosting guests? Get a turnover quote →
            </Link>
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
          {[
            { icon: Home, title: "Built for homes", text: "A short form about your house, not a rental." },
            { icon: ShieldCheck, title: "Pay after the clean", text: "No payment upfront. Pay by card or Zelle after your visit." },
          ].map((item) => (
            <article key={item.title} className="rounded-xl border border-vm-border bg-white p-5">
              <item.icon className="h-5 w-5 text-vm-cyan-dark" />
              <h2 className="mt-3 font-heading text-lg font-bold text-vm-navy">{item.title}</h2>
              <p className="mt-2 font-body text-sm text-vm-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <AfterTheClean variant="home" />

      <section id="request" className="bg-vm-surface px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-2xl font-bold text-vm-navy">
            Request a residential estimate
          </h2>
          <p className="mt-2 font-body text-sm text-vm-muted">
            Tell us about your home. No card needed.
          </p>
          <ResidentialIntakeForm />
          <p className="mt-6 text-center font-body text-xs text-vm-muted">
            Questions? Call or text {VERMONT_SUPPORT.phoneDisplay}.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
