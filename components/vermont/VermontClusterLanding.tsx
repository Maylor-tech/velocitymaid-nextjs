import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import BranchLandingNav from "@/components/layout/BranchLandingNav";
import VermontGallery from "@/components/home/VermontGallery";
import { ServiceImageCard, TrustBadge } from "@/components/vermont/shared";
import type { VermontClusterConfig } from "@/lib/vermont/clusters";
import { MIDDLEBURY_PHOTO_PATHS } from "@/lib/vermont/middleburyPhotos";
import {
  Home,
  BedDouble,
  Snowflake,
  MapPin,
  Clock,
} from "lucide-react";

export interface VermontClusterLandingProps {
  cluster: VermontClusterConfig;
}

export default function VermontClusterLanding({
  cluster,
}: VermontClusterLandingProps) {
  return (
    <div className="min-h-screen bg-white font-body">
      <BranchLandingNav
        bookingHref="/vermont/host-intake"
        bookingLabel="Host Intake"
        phone="+18027335348"
        phoneDisplay="(802) 733-5348"
        email="hello@velocitymaid.com"
        marketTagline="vermont"
      />

      <section className="bg-vm-navy">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-body font-medium text-vm-cyan mb-4">
                <Snowflake className="w-3 h-3" />
                <span>{cluster.eyebrow}</span>
              </div>
              <h1 className="font-heading font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">
                {cluster.headline}
              </h1>
              <p className="font-body text-white/70 text-base sm:text-lg mb-6">
                {cluster.heroDescription}
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  href="/vermont/host-intake"
                  className="inline-flex items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-5 py-3 text-sm hover:bg-vm-cyan-dark transition"
                >
                  Book Vermont Cleaning
                </Link>
                <Link
                  href="/vermont"
                  className="inline-flex items-center justify-center border border-white/25 text-white font-heading rounded-lg px-5 py-3 text-sm hover:bg-white/10 transition"
                >
                  All Vermont locations →
                </Link>
              </div>
              <div className="flex flex-wrap gap-4">
                <TrustBadge>Turnover-ready in time for check-in</TrustBadge>
                <TrustBadge>Photo report after every clean</TrustBadge>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/3] md:aspect-auto md:min-h-[420px]">
              <Image
                src={cluster.heroImage}
                alt={cluster.heroImageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 560px"
                priority
              />
              <div
                className="absolute bottom-0 left-0 right-0 px-4 py-3"
                style={{
                  background:
                    "linear-gradient(to top, rgba(6,27,68,0.9), transparent)",
                }}
              >
                <p className="font-heading font-semibold text-white text-sm">
                  {cluster.heroLocationLabel}
                </p>
                <p className="font-body text-white/60 text-xs">
                  {cluster.heroLocationSub}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative rounded-xl overflow-hidden border border-vm-border aspect-[4/3]">
            <Image
              src={MIDDLEBURY_PHOTO_PATHS.frontEntry}
              alt="VelocityMaid property care at Vermont rental front entry"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
          <div>
            <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2">
              Property care
            </p>
            <h2 className="font-heading font-bold text-vm-navy text-2xl mb-3">
              Cared for like your guests are already on the way
            </h2>
            <p className="text-vm-muted font-body text-sm leading-relaxed">
              From welcoming front entries to guest-ready interiors, VelocityMaid
              delivers consistent, photo-documented cleans for Vermont hosts who
              manage from out of state.
            </p>
          </div>
        </section>

        <ServicesSection />

        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2">
              Host readiness
            </p>
            <h2 className="font-heading font-bold text-vm-navy text-2xl mb-3">
              Every arrival starts at the door
            </h2>
            <p className="text-vm-muted font-body text-sm leading-relaxed">
              Accessible entries, clean walkways, and a welcoming first
              impression — VelocityMaid prepares your property so remote owners
              can manage confidently.
            </p>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-vm-border aspect-[4/3] order-1 md:order-2">
            <Image
              src={MIDDLEBURY_PHOTO_PATHS.sideEntry}
              alt="VelocityMaid property readiness service at Vermont rental side entry"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        </section>

        <VermontGallery
          regionLabel={cluster.galleryRegionLabel}
          headline={cluster.galleryHeadline}
          subheadline={cluster.gallerySubheadline}
          trustLine={cluster.galleryTrustLine}
        />

        <section className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-vm-cyan" />
              <h2 className="font-heading font-bold text-vm-navy text-2xl">
                Service Area
              </h2>
            </div>
            <p className="text-vm-muted font-body text-sm">
              {cluster.serviceAreaIntro}
            </p>
            <ul className="text-sm text-vm-text font-body space-y-1">
              {cluster.serviceAreas.map((area) => (
                <li key={area}>• {area}</li>
              ))}
            </ul>
            <p className="text-xs text-vm-muted font-body mt-2">
              Have a property slightly outside this area? Reach out using the
              host intake form — we&apos;ll let you know if we can accommodate
              your location.
            </p>
          </div>
          <HowItWorksSection />
        </section>

        <CtaSection clusterLabel={cluster.navLabel} />

        <section className="border-t border-vm-border pt-6 text-xs text-vm-muted font-body space-y-1">
          <p>
            VelocityMaid — Vermont Operations Support · 79 Main Street, Apt 7,
            Ludlow, VT 05149, USA
          </p>
          <p>{cluster.footerServing}</p>
          <p>
            <Link href="/vermont" className="text-vm-cyan hover:underline">
              View all Vermont service areas →
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

function ServicesSection() {
  return (
    <section>
      <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2">
        Our Services
      </p>
      <h2 className="font-heading font-bold text-vm-navy text-2xl mb-4">
        Vermont Cleaning Services
      </h2>
      <p className="text-vm-muted font-body max-w-3xl mb-8">
        Whether you&apos;re managing a ski rental, hosting guests on Airbnb,
        or maintaining a second home, VelocityMaid offers structured cleaning
        that fits your schedule and standards.
      </p>
      <div className="grid md:grid-cols-3 gap-5">
        <ServiceImageCard
          imageSrc={MIDDLEBURY_PHOTO_PATHS.bedroomMain}
          imageAlt="VelocityMaid bedroom turnover service in Vermont"
        >
          <ServiceCardHeader icon={<Home className="w-5 h-5 text-vm-cyan" />}>
            Rental Turnover Cleaning
          </ServiceCardHeader>
          <p className="text-sm text-vm-muted font-body mb-3">
            Quick, consistent cleaning between check-out and check-in.
          </p>
          <ul className="text-xs text-vm-muted font-body space-y-1">
            <li>• Beds stripped & remade</li>
            <li>• Bathrooms & kitchens reset</li>
            <li>• Floors vacuumed & mopped</li>
            <li>• Photo report included</li>
          </ul>
        </ServiceImageCard>

        <ServiceImageCard
          imageSrc={MIDDLEBURY_PHOTO_PATHS.bathroomMain}
          imageAlt="VelocityMaid bathroom deep cleaning in Vermont"
        >
          <ServiceCardHeader icon={<Snowflake className="w-5 h-5 text-vm-cyan" />}>
            Deep Winter / Seasonal Cleans
          </ServiceCardHeader>
          <p className="text-sm text-vm-muted font-body mb-3">
            Detailed deep clean before or after ski season.
          </p>
          <ul className="text-xs text-vm-muted font-body space-y-1">
            <li>• Baseboards, edges, and corners</li>
            <li>• High-touch surfaces & appliances</li>
            <li>• Dust & cobweb removal</li>
            <li>• Entryways & mudroom refresh</li>
          </ul>
        </ServiceImageCard>

        <ServiceImageCard
          imageSrc={MIDDLEBURY_PHOTO_PATHS.homeRefresh}
          imageAlt="VelocityMaid property readiness service for Vermont second homes"
        >
          <ServiceCardHeader icon={<BedDouble className="w-5 h-5 text-vm-cyan" />}>
            Second Home & Condo Care
          </ServiceCardHeader>
          <p className="text-sm text-vm-muted font-body mb-3">
            Scheduled visits to keep your Vermont home fresh when you&apos;re
            away.
          </p>
          <ul className="text-xs text-vm-muted font-body space-y-1">
            <li>• Monthly or bi-weekly cleans</li>
            <li>• Pre-arrival and post-departure visits</li>
            <li>• Optional photo confirmations</li>
          </ul>
        </ServiceImageCard>
      </div>
    </section>
  );
}

function ServiceCardHeader({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-10 w-10 items-center justify-center bg-vm-cyan/10 rounded-lg">
        {icon}
      </span>
      <h3 className="font-heading font-medium text-vm-navy">{children}</h3>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-vm-cyan" />
        <h2 className="font-heading font-bold text-vm-navy text-2xl">
          How It Works
        </h2>
      </div>
      <ol className="space-y-3 text-sm text-vm-text font-body">
        <li>
          <span className="font-semibold text-vm-navy">1. Tell us about your property:</span>{" "}
          Complete the Vermont host intake form with your rental details.
        </li>
        <li>
          <span className="font-semibold text-vm-navy">2. Confirm:</span>{" "}
          We&apos;ll follow up with scheduling and pricing for your turnover or
          deep clean.
        </li>
        <li>
          <span className="font-semibold text-vm-navy">3. We clean:</span>{" "}
          Our team completes your checklist and sends a photo report.
        </li>
        <li>
          <span className="font-semibold text-vm-navy">4. Guest-ready:</span>{" "}
          Your property is prepared for the next arrival.
        </li>
      </ol>
    </div>
  );
}

function CtaSection({ clusterLabel }: { clusterLabel: string }) {
  return (
    <section className="rounded-xl border border-vm-border bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2">
          Ready for your next guests?
        </p>
        <h2 className="font-heading font-bold text-vm-navy text-2xl mb-2">
          Let&apos;s get your {clusterLabel} property guest-ready.
        </h2>
        <p className="text-sm text-vm-muted font-body max-w-xl">
          VelocityMaid helps Vermont hosts and homeowners prepare clean,
          welcoming spaces with professional care.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href="/vermont/host-intake"
          className="inline-flex flex-1 sm:flex-none items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-5 py-3 text-sm hover:bg-vm-cyan-dark transition"
        >
          Get a quote
        </Link>
        <a
          href="https://wa.me/18027335348"
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 sm:flex-none items-center justify-center border border-vm-border text-vm-navy font-heading rounded-lg px-5 py-3 text-sm hover:bg-vm-surface transition"
        >
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
}
