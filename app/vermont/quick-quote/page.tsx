import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { VermontQuickQuoteForm } from "@/components/hosts/VermontQuickQuoteForm";
import { pageSocialMetadata } from "@/lib/seo/socialImages";
import {
  VERMONT_HOME_WATCH_PATH,
  VERMONT_HOST_INTAKE_PATH,
} from "@/lib/marketing/publicCtas";

const title = "Vermont Quick Quote | VelocityMaid";
const description =
  "Get a fast Vermont host cleaning quote — town, property size, and service interest. No payment required.";

export const metadata: Metadata = {
  title,
  description,
  ...pageSocialMetadata({
    title,
    description,
    path: "/vermont/quick-quote",
    image: "vermont",
  }),
};

export default function VermontQuickQuotePage() {
  return (
    <div className="min-h-screen bg-vm-surface">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
          Vermont hosts
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-vm-navy sm:text-4xl">
          Quick quote
        </h1>
        <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
          About 90 seconds. No access codes, no payment, and no guarantee of
          availability until we confirm. Prefer full property onboarding?{" "}
          <Link
            href={VERMONT_HOST_INTAKE_PATH}
            className="font-semibold text-vm-navy underline-offset-2 hover:underline"
          >
            Open the full intake
          </Link>
          . Winter away?{" "}
          <Link
            href={`${VERMONT_HOME_WATCH_PATH}?service=home-watch`}
            className="font-semibold text-vm-navy underline-offset-2 hover:underline"
          >
            Home Watch
          </Link>
          .
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="py-12 text-center font-body text-sm text-vm-muted">
                Loading form…
              </div>
            }
          >
            <VermontQuickQuoteForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
