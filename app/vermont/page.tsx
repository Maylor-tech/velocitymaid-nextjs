import type { ReactNode } from "react";
import { Metadata } from 'next';
import Link from 'next/link';
import BranchLandingNav from '@/components/layout/BranchLandingNav';
import VermontGallery from '@/components/home/VermontGallery';
import {
  Mountain,
  Home,
  BedDouble,
  Snowflake,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vermont Cleaning Services | VelocityMaid — Okemo Valley',
  description:
    'VelocityMaid provides professional cleaning services in Ludlow, Vermont and the Okemo Valley region — perfect for ski rentals, Airbnbs, second homes, and seasonal guests.',
};

function TrustBadge({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-body text-white/60">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vm-cyan/20">
        <CheckCircle2 className="h-2.5 w-2.5 text-vm-cyan" />
      </span>
      <span>{children}</span>
    </div>
  );
}

export default function VermontPage() {
  return (
    <div className="min-h-screen bg-vm-surface font-body">
      <BranchLandingNav
        bookingHref="/booking?location=vermont"
        bookingLabel="Book a Clean"
        phone="+18027335348"
        phoneDisplay="(802) 733-5348"
        email="hello@velocitymaid.com"
        marketTagline="vermont"
      />

      {/* Hero */}
      <section className="bg-vm-navy">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-body font-medium text-vm-cyan mb-4">
                <Snowflake className="w-3 h-3" />
                <span>New • Vermont Branch — Okemo Valley</span>
              </div>
              <h1 className="font-heading font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">
                Vermont Cleaning Services for{' '}
                <span className="text-vm-cyan">
                  Ski Rentals, Airbnbs & Second Homes
                </span>
              </h1>
              <p className="font-body text-white/60 text-base sm:text-lg mb-6">
                VelocityMaid now serves Ludlow and the Okemo Valley — offering
                professional turnover cleaning, deep winter cleans, and
                second-home care for busy owners and hosts.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  href="/vermont/host-intake"
                  className="inline-flex items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-5 py-3 text-sm hover:bg-vm-cyan-dark transition"
                >
                  Book Vermont Cleaning
                </Link>
                <Link
                  href="/vermont/host-intake"
                  className="inline-flex items-center justify-center border border-white/25 text-white/80 font-heading rounded-lg px-5 py-3 text-sm hover:bg-white/10 transition"
                >
                  Airbnb / Host Package
                </Link>
              </div>
              <div className="flex flex-wrap gap-4">
                <TrustBadge>Turnover-ready in time for check-in</TrustBadge>
                <TrustBadge>Trusted by homeowners & hosts</TrustBadge>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Mountain className="w-7 h-7 text-vm-cyan" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-vm-cyan font-body font-semibold">
                    Okemo Valley • Vermont
                  </p>
                  <p className="text-sm text-white/45 font-body">
                    Perfect for ski trips & winter rentals
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-vm-cyan/10 rounded-lg">
                    <Home className="w-4 h-4 text-vm-cyan" />
                  </span>
                  <div>
                    <p className="text-white font-heading font-medium text-sm">
                      Airbnb & Short-Term Rental Turnovers
                    </p>
                    <p className="text-white/45 font-body text-xs mt-1">
                      Fast, reliable cleaning between guest stays — we handle
                      trash, bathrooms, kitchens, floors, and quick resets.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-vm-cyan/10 rounded-lg">
                    <BedDouble className="w-4 h-4 text-vm-cyan" />
                  </span>
                  <div>
                    <p className="text-white font-heading font-medium text-sm">
                      Linen & Bedding Support
                    </p>
                    <p className="text-white/45 font-body text-xs mt-1">
                      Optional add-on for fresh sheets, towels, and bed
                      make-ups to keep guests comfortable and reviews high.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-vm-cyan/10 rounded-lg">
                    <Snowflake className="w-4 h-4 text-vm-cyan" />
                  </span>
                  <div>
                    <p className="text-white font-heading font-medium text-sm">
                      Deep Winter Cleaning
                    </p>
                    <p className="text-white/45 font-body text-xs mt-1">
                      Tackle salt, snow, mud, and fireplace dust with seasonal
                      deep cleans before or after ski season.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs text-white/45 font-body border-t border-white/10 pt-3">
                <span>Locally operated from Ludlow, VT</span>
                <span>Built for ski season demand</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
        {/* Services */}
        <section className="bg-vm-surface -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 sm:py-12 rounded-none">
          <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2">
            Our Services
          </p>
          <h2 className="font-heading font-bold text-vm-navy text-2xl mb-4">
            Vermont Cleaning Services
          </h2>
          <p className="text-vm-muted font-body max-w-3xl mb-8">
            Whether you&apos;re managing a ski rental, hosting guests on Airbnb,
            or maintaining a second home in the Okemo Valley, VelocityMaid
            offers structured cleaning services that fit your schedule and
            standards.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white border border-vm-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[#EBF9FA] rounded-lg">
                  <Home className="w-5 h-5 text-vm-cyan-dark" />
                </span>
                <h3 className="font-heading font-medium text-vm-navy">
                  Rental Turnover Cleaning
                </h3>
              </div>
              <p className="text-sm text-vm-muted font-body mb-3">
                Ideal for Airbnb, Vrbo, and ski-season rentals. Quick,
                consistent cleaning between check-out and check-in.
              </p>
              <ul className="text-xs text-vm-muted font-body space-y-1">
                <li>• Bathrooms & kitchens disinfected</li>
                <li>• Floors vacuumed & mopped</li>
                <li>• Trash removed & bins reset</li>
                <li>• Light staging & guest-ready touches</li>
              </ul>
            </div>
            <div className="bg-white border border-vm-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[#EBF9FA] rounded-lg">
                  <Snowflake className="w-5 h-5 text-vm-cyan-dark" />
                </span>
                <h3 className="font-heading font-medium text-vm-navy">
                  Deep Winter / Seasonal Cleans
                </h3>
              </div>
              <p className="text-sm text-vm-muted font-body mb-3">
                Before or after the ski season, we reset your space with a
                detailed deep clean.
              </p>
              <ul className="text-xs text-vm-muted font-body space-y-1">
                <li>• Baseboards, edges, and corners</li>
                <li>• High-touch surfaces & appliances</li>
                <li>• Dust & cobweb removal</li>
                <li>• Entryways & mudroom refresh</li>
              </ul>
            </div>
            <div className="bg-white border border-vm-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[#EBF9FA] rounded-lg">
                  <BedDouble className="w-5 h-5 text-vm-cyan-dark" />
                </span>
                <h3 className="font-heading font-medium text-vm-navy">
                  Second Home & Condo Care
                </h3>
              </div>
              <p className="text-sm text-vm-muted font-body mb-3">
                Scheduled visits to keep your Vermont home fresh, even when
                you&apos;re out of town.
              </p>
              <ul className="text-xs text-vm-muted font-body space-y-1">
                <li>• Monthly or bi-weekly cleans</li>
                <li>• Pre-arrival and post-departure visits</li>
                <li>• Optional photo confirmations</li>
              </ul>
            </div>
          </div>
        </section>

        <VermontGallery />

        {/* Service Area & How It Works */}
        <section className="grid md:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-vm-cyan-dark" />
              <h2 className="font-heading font-bold text-vm-navy text-2xl">
                Service Area — Vermont
              </h2>
            </div>
            <p className="text-vm-muted font-body text-sm">
              VelocityMaid currently serves the Okemo Valley region:
            </p>
            <ul className="text-sm text-vm-text font-body space-y-1">
              <li>• Ludlow</li>
              <li>• Okemo Mountain area</li>
              <li>• Proctorsville</li>
              <li>• Cavendish</li>
              <li>• Nearby ski rentals and second homes</li>
            </ul>
            <p className="text-xs text-vm-muted font-body mt-2">
              Have a property slightly outside this area? Reach out using the
              contact form — we&apos;ll let you know if we can accommodate your
              location.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-vm-cyan-dark" />
              <h2 className="font-heading font-bold text-vm-navy text-2xl">
                How It Works
              </h2>
            </div>
            <ol className="space-y-3 text-sm text-vm-text font-body">
              <li>
                <span className="font-semibold text-vm-navy">1. Book:</span>{' '}
                Use our online booking form and select{' '}
                <span className="font-medium text-vm-cyan-dark">Vermont</span>{' '}
                as your service location.
              </li>
              <li>
                <span className="font-semibold text-vm-navy">2. Confirm:</span>{' '}
                You&apos;ll receive email and SMS/WhatsApp confirmation with all
                details.
              </li>
              <li>
                <span className="font-semibold text-vm-navy">3. We Clean:</span>{' '}
                Our trusted cleaners arrive within the agreed window, complete
                your checklist, and leave the space guest-ready.
              </li>
              <li>
                <span className="font-semibold text-vm-navy">4. Follow-Up:</span>{' '}
                You&apos;ll receive a short follow-up to confirm everything met
                your expectations.
              </li>
            </ol>
          </div>
        </section>

        {/* CTA & Contact */}
        <section className="rounded-xl border border-vm-border bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-vm-cyan text-xs font-semibold uppercase tracking-widest font-body mb-2">
              Ready for ski season?
            </p>
            <h2 className="font-heading font-bold text-vm-navy text-2xl mb-2">
              Let&apos;s get your Vermont property guest-ready.
            </h2>
            <p className="text-sm text-vm-muted font-body max-w-xl">
              Whether you&apos;re hosting every weekend or visiting a few times
              a year, VelocityMaid helps keep your space clean, welcoming, and
              ready on arrival.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/booking?location=vermont"
              className="inline-flex flex-1 sm:flex-none items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-5 py-3 text-sm hover:bg-vm-cyan-dark transition"
            >
              Book Vermont Cleaning
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

        {/* Footer Info */}
        <section className="border-t border-vm-border pt-6 text-xs text-vm-muted font-body space-y-1">
          <p>
            VelocityMaid — Vermont Operations Support • 79 Main Street, Apt 7,
            Ludlow, VT 05149, USA
          </p>
          <p>Serving: Ludlow, Okemo Valley, and nearby ski communities.</p>
        </section>
      </main>
    </div>
  );
}
