import type { Metadata } from "next";
import Link from "next/link";
import { FastEstimate } from "@/components/estimate/FastEstimate";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Fast Cleaning Estimate | VelocityMaid";
const description =
  "Get a fast cleaning estimate in seconds. Enter your ZIP, pick a service, and see a ballpark price — or request a tailored quote. New Jersey & Vermont.";

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

export default function EstimatePage() {
  return (
    <main className="min-h-screen bg-vm-surface">
      <header className="border-b border-vm-border bg-vm-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-heading text-lg font-bold text-vm-navy">
            VelocityMaid
          </Link>
          <Link
            href="/vermont"
            className="font-body text-sm font-semibold text-vm-cyan-dark hover:underline"
          >
            Vermont hosts
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h1 className="font-heading text-3xl font-bold text-vm-navy sm:text-4xl">
            See your price in seconds
          </h1>
          <p className="mt-3 font-body text-base text-vm-muted">
            No account, no commitment. Enter a few details and get a fast
            ballpark — our team confirms the final price after a quick review.
          </p>
        </div>

        <FastEstimate />

        <p className="mx-auto mt-6 max-w-xl text-center font-body text-xs text-vm-muted">
          Estimates are informational only and not a final quote. Final pricing
          depends on home condition and scope, confirmed before any service.
        </p>
      </section>
    </main>
  );
}
