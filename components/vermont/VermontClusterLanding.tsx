import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import BranchLandingNav from "@/components/layout/BranchLandingNav";
import VermontGallery from "@/components/home/VermontGallery";
import { ServiceImageCard, TrustBadge } from "@/components/vermont/shared";
import type { VermontClusterConfig } from "@/lib/vermont/clusters";
import {
  Home,
  BedDouble,
  Snowflake,
  MapPin,
  Clock,
} from "lucide-react";
import {
  VERMONT_OPERATIONS_SUPPORT_LINE1,
  VERMONT_OPERATIONS_SUPPORT_LINE2,
} from "@/lib/company/businessAddress";
import { EditorialProof } from "@/components/marketing/EditorialProof";
import { MIDDLEBURY_PROOF, TURNOVER_PROOF } from "@/lib/marketing/portfolio";

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
        bookingLabel="Request a Quote"
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
                  Request a walkthrough
                </Link>
                <a
                  href="tel:+18027335348"
                  className="inline-flex items-center justify-center border border-white/25 text-white font-heading rounded-lg px-5 py-3 text-sm hover:bg-white/10 transition"
                >
                  Call (802) 733-5348
                </a>
                <Link
                  href="/vermont"
                  className="inline-flex items-center justify-center border border-white/25 text-white font-heading rounded-lg px-5 py-3 text-sm hover:bg-white/10 transition"
                >
                  All Vermont locations →
                </Link>
              </div>
              <div className="flex flex-wrap gap-4">
                <TrustBadge>Turnovers planned around guest timing</TrustBadge>
                <TrustBadge>
                  Completion photos when included in the service standard
                </TrustBadge>
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
              src={cluster.contentImages.propertyCare.src}
              alt={cluster.contentImages.propertyCare.alt}
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
              delivers consistent, property-standard cleans for Vermont hosts who
              manage from out of state—with completion documentation when included
              in the service plan.
            </p>
          </div>
        </section>

        <ServicesSection cluster={cluster} />

        {cluster.slug === "middlebury" ? (
          <EditorialProof
            id="middlebury-proof"
            contained
            tone="light"
            eyebrow="Middlebury property care"
            heading="Real Vermont Properties. Guest-Ready Results."
            copy="Property readiness for Middlebury homes and vacation rentals — interiors and outdoor living prepared for arriving guests."
            featured={MIDDLEBURY_PROOF.featured}
            supporting={MIDDLEBURY_PROOF.supporting}
          />
        ) : null}

        <EditorialProof
          id="turnover-proof"
          contained
          tone="navy"
          eyebrow="Guest-ready resets"
          heading="Prepared room by room for the next arrival."
          copy="Guest-ready resets, presentation standards, and careful room-by-room preparation between stays — so the property is ready when guests walk in."
          featured={TURNOVER_PROOF.featured}
          supporting={TURNOVER_PROOF.supporting}
        />

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
              src={cluster.contentImages.hostReadiness.src}
              alt={cluster.contentImages.hostReadiness.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        </section>

        <VermontGallery
          photos={cluster.galleryPhotos}
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
            {VERMONT_OPERATIONS_SUPPORT_LINE1}{" "}
            {VERMONT_OPERATIONS_SUPPORT_LINE2}
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

function ServicesSection({ cluster }: { cluster: VermontClusterConfig }) {
  const isOkemo = cluster.slug === "okemo";

  return (
    <section>
      <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2">
        Our Services
      </p>
      <h2 className="font-heading font-bold text-vm-navy text-2xl mb-4">
        {isOkemo ? "Okemo Valley Turnover Services" : "Middlebury Property-Care Services"}
      </h2>
      <p className="text-vm-muted font-body max-w-3xl mb-8">
        {isOkemo
          ? "Ski-season scheduling, guest-ready resets, and local operational support for vacation rentals and remote-owned homes across the Okemo Valley."
          : "Vacation-rental turnovers, deep cleaning, second-home care, and clear host communication for Middlebury and Addison County properties."}
      </p>
      <div className="grid md:grid-cols-3 gap-5">
        <ServiceImageCard
          imageSrc={cluster.contentImages.turnover.src}
          imageAlt={cluster.contentImages.turnover.alt}
        >
          <ServiceCardHeader icon={<Home className="w-5 h-5 text-vm-cyan" />}>
            Rental Turnover Cleaning
          </ServiceCardHeader>
          <p className="text-sm text-vm-muted font-body mb-3">
            Consistent cleaning between check-out and check-in, planned around guest timing.
          </p>
          <ul className="text-xs text-vm-muted font-body space-y-1">
            <li>• Beds stripped & remade</li>
            <li>• Bathrooms & kitchens reset</li>
            <li>• Floors vacuumed & mopped</li>
            <li>• Completion photos when included</li>
          </ul>
        </ServiceImageCard>

        <ServiceImageCard
          imageSrc={cluster.contentImages.seasonal.src}
          imageAlt={cluster.contentImages.seasonal.alt}
        >
          <ServiceCardHeader icon={<Snowflake className="w-5 h-5 text-vm-cyan" />}>
            {isOkemo ? "Ski-Season & Deep Cleans" : "Deep Cleaning & Seasonal Resets"}
          </ServiceCardHeader>
          <p className="text-sm text-vm-muted font-body mb-3">
            {isOkemo
              ? "Detailed deep cleans before peak season or between heavier guest cycles."
              : "Thorough deep cleans and property readiness for second homes and guest stays."}
          </p>
          <ul className="text-xs text-vm-muted font-body space-y-1">
            <li>• Baseboards, edges, and corners</li>
            <li>• High-touch surfaces & appliances</li>
            <li>• Dust & cobweb removal</li>
            <li>• Entryways & mudroom refresh</li>
          </ul>
        </ServiceImageCard>

        <ServiceImageCard
          imageSrc={cluster.contentImages.refresh.src}
          imageAlt={cluster.contentImages.refresh.alt}
        >
          <ServiceCardHeader icon={<BedDouble className="w-5 h-5 text-vm-cyan" />}>
            {isOkemo ? "Remote-Owner Support" : "Second Home & Condo Care"}
          </ServiceCardHeader>
          <p className="text-sm text-vm-muted font-body mb-3">
            {isOkemo
              ? "Local support so remote owners can manage turnovers with confidence."
              : "Scheduled visits to keep your Vermont home fresh when you are away."}
          </p>
          <ul className="text-xs text-vm-muted font-body space-y-1">
            <li>• Property-specific service standards</li>
            <li>• Pre-arrival and post-departure visits</li>
            <li>• Host communication & observations</li>
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
          <span className="font-semibold text-vm-navy">1. Property intake &amp; walkthrough:</span>{" "}
          Call, email, or share property details so we can review scope and standards.
        </li>
        <li>
          <span className="font-semibold text-vm-navy">2. Property profile &amp; service standard:</span>{" "}
          We confirm a property-specific checklist and quote before service begins.
        </li>
        <li>
          <span className="font-semibold text-vm-navy">3. Scheduled turnover:</span>{" "}
          Cleaning is planned around checkout and check-in windows.
        </li>
        <li>
          <span className="font-semibold text-vm-navy">4. Quality control &amp; host communication:</span>{" "}
          Completion checks, documentation when included, and clear updates for the next arrival.
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
          Request a walkthrough or quote, call or text, or complete property intake
          when you are ready.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href="/vermont/host-intake"
          className="inline-flex flex-1 sm:flex-none items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-5 py-3 text-sm hover:bg-vm-cyan-dark transition"
        >
          Request a quote
        </Link>
        <a
          href="tel:+18027335348"
          className="inline-flex flex-1 sm:flex-none items-center justify-center border border-vm-border text-vm-navy font-heading rounded-lg px-5 py-3 text-sm hover:bg-vm-surface transition"
        >
          Call (802) 733-5348
        </a>
        <a
          href="https://wa.me/18027335348"
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 sm:flex-none items-center justify-center border border-vm-border text-vm-navy font-heading rounded-lg px-5 py-3 text-sm hover:bg-vm-surface transition"
        >
          WhatsApp
        </a>
      </div>
    </section>
  );
}
