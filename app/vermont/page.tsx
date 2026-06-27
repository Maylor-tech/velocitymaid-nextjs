import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BranchLandingNav from "@/components/layout/BranchLandingNav";
import { VERMONT_CLUSTER_LIST } from "@/lib/vermont/clusters";
import { MIDDLEBURY_PHOTO_PATHS } from "@/lib/vermont/middleburyPhotos";
import { ArrowRight, MapPin, Snowflake } from "lucide-react";

export const metadata: Metadata = {
  title: "Vermont Cleaning Services | VelocityMaid — Okemo Valley & Middlebury",
  description:
    "VelocityMaid offers turnover cleaning, deep cleans, and property readiness across Vermont — Okemo Valley vacation rentals and Middlebury property readiness in Addison County.",
  keywords:
    "Vermont cleaning services, Okemo Valley cleaning, Middlebury cleaning, vacation rental cleaning Vermont, Airbnb turnover Vermont, property readiness Vermont",
  openGraph: {
    title: "Vermont Cleaning Services | VelocityMaid",
    description:
      "Professional cleaning for Okemo Valley ski rentals and Middlebury vacation properties.",
    images: [
      {
        url: MIDDLEBURY_PHOTO_PATHS.exteriorHero,
        width: 1200,
        height: 630,
        alt: "VelocityMaid Vermont vacation rental exterior",
      },
    ],
  },
};

export default function VermontOverviewPage() {
  return (
    <div className="min-h-screen bg-white font-body">
      <BranchLandingNav
        bookingHref="/booking?location=vermont"
        bookingLabel="Book a Clean"
        phone="+18027335348"
        phoneDisplay="(802) 733-5348"
        email="hello@velocitymaid.com"
        marketTagline="vermont"
      />

      <section className="bg-vm-navy">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-body font-medium text-vm-cyan mb-4">
              <Snowflake className="w-3 h-3" />
              <span>Vermont · Two service clusters</span>
            </div>
            <h1 className="font-heading font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">
              Vermont Cleaning for{" "}
              <span className="text-vm-cyan">
                Vacation Rentals & Second Homes
              </span>
            </h1>
            <p className="font-body text-white/70 text-base sm:text-lg mb-8">
              VelocityMaid operates in two Vermont clusters — Okemo Valley for
              ski rentals and short-term turnovers, and Middlebury for property
              readiness across Addison County. Choose your area below.
            </p>
            <Link
              href="/vermont/host-intake"
              className="inline-flex items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-5 py-3 text-sm hover:bg-vm-cyan-dark transition"
            >
              Vermont host intake form
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
        <section>
          <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2">
            Service areas
          </p>
          <h2 className="font-heading font-bold text-vm-navy text-2xl mb-4">
            Choose your Vermont cluster
          </h2>
          <p className="text-vm-muted font-body max-w-3xl mb-8">
            Each cluster has dedicated local coverage, tailored messaging, and
            the same VelocityMaid standards — photo reports, turnover-ready
            timing, and professional care.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {VERMONT_CLUSTER_LIST.map((cluster) => (
              <Link
                key={cluster.slug}
                href={cluster.path}
                className="group rounded-xl border border-vm-border overflow-hidden bg-white hover:border-vm-cyan/40 hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-vm-navy">
                  <Image
                    src={cluster.heroImage}
                    alt={cluster.heroImageAlt}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 560px"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(6,27,68,0.85), transparent 55%)",
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-body font-semibold text-vm-cyan uppercase tracking-widest mb-1">
                      {cluster.eyebrow}
                    </p>
                    <h3 className="font-heading font-bold text-white text-xl leading-snug">
                      {cluster.headline}
                    </h3>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-vm-cyan shrink-0 mt-0.5" />
                    <p className="text-sm text-vm-muted font-body">
                      {cluster.serviceAreas.join(" · ")}
                    </p>
                  </div>
                  <p className="text-sm text-vm-text font-body mb-4 flex-1">
                    {cluster.heroDescription}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-heading font-semibold text-vm-cyan group-hover:gap-2 transition-all">
                    Explore {cluster.navLabel}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-vm-border bg-vm-surface/50 p-6 sm:p-8">
          <h2 className="font-heading font-bold text-vm-navy text-xl mb-2">
            Not sure which cluster fits?
          </h2>
          <p className="text-sm text-vm-muted font-body mb-4 max-w-2xl">
            Submit the Vermont host intake form with your property address —
            we&apos;ll confirm coverage and follow up with scheduling and pricing.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/vermont/host-intake"
              className="inline-flex items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-5 py-3 text-sm hover:bg-vm-cyan-dark transition"
            >
              Host intake form
            </Link>
            <a
              href="https://wa.me/18027335348"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center border border-vm-border text-vm-navy font-heading rounded-lg px-5 py-3 text-sm hover:bg-white transition"
            >
              Chat on WhatsApp
            </a>
          </div>
        </section>

        <section className="border-t border-vm-border pt-6 text-xs text-vm-muted font-body space-y-1">
          <p>
            VelocityMaid — Vermont Operations Support · 79 Main Street, Apt 7,
            Ludlow, VT 05149, USA
          </p>
          <p>
            Serving Okemo Valley (Ludlow, Proctorsville, Cavendish, Chester) and
            Middlebury / Addison County.
          </p>
        </section>
      </main>
    </div>
  );
}
