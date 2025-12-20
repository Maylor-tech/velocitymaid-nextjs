// app/vermont/page.tsx

import { Metadata } from 'next';

import Link from 'next/link';

import {

  Mountain,

  Home,

  BedDouble,

  Snowflake,

  Sparkles,

  MapPin,

  Clock,

  CheckCircle2,

  Phone,

  Mail,

} from 'lucide-react';

export const metadata: Metadata = {

  title: 'Vermont Cleaning Services | VelocityMaid — Ludlow & Okemo Valley',

  description:

    'VelocityMaid provides professional cleaning services in Ludlow, Vermont and the Okemo Valley region — perfect for ski rentals, Airbnbs, second homes, and seasonal guests.',

};

export default function VermontPage() {

  return (

    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* Top Bar */}

      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2">

            <Sparkles className="w-6 h-6 text-sky-500" />

            <span className="font-semibold text-slate-900 text-lg">

              VelocityMaid

            </span>

          </Link>

          <div className="hidden sm:flex items-center gap-6 text-sm">

            <div className="flex items-center gap-2 text-slate-600">

              <Phone className="w-4 h-4" />

              <a href="tel:+18027335348" className="hover:text-sky-600">

                (802) 733-5348

              </a>

            </div>

            <div className="flex items-center gap-2 text-slate-600">

              <Mail className="w-4 h-4" />

              <a

                href="mailto:hello@velocitymaid.com"

                className="hover:text-sky-600"

              >

                hello@velocitymaid.com

              </a>

            </div>

            <Link

              href="/booking?location=vermont"

              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"

            >

              Book a Clean

            </Link>

          </div>

        </div>

      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">

        {/* Hero */}

        <section className="grid md:grid-cols-2 gap-10 items-center">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 mb-4">

              <Snowflake className="w-3 h-3" />

              <span>New • Vermont Branch — Okemo Valley</span>

            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">

              Vermont Cleaning Services for{' '}

              <span className="text-sky-600">

                Ski Rentals, Airbnbs & Second Homes

              </span>

            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-6">

              VelocityMaid now serves Ludlow and the Okemo Valley — offering

              professional turnover cleaning, deep winter cleans, and

              second-home care for busy owners and hosts.

            </p>

            <div className="flex flex-wrap gap-3 mb-6">

              <Link

                href="/booking?location=vermont"

                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"

              >

                Book Vermont Cleaning

              </Link>

              <Link

                href="/booking?location=vermont&type=host"

                className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 hover:border-sky-400 hover:bg-sky-50 transition"

              >

                Airbnb / Host Package

              </Link>

            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">

              <div className="flex items-center gap-2">

                <CheckCircle2 className="w-4 h-4 text-green-500" />

                <span>Turnover-ready in time for check-in</span>

              </div>

              <div className="flex items-center gap-2">

                <CheckCircle2 className="w-4 h-4 text-green-500" />

                <span>Trusted by homeowners & hosts</span>

              </div>

            </div>

          </div>

          <div className="relative">

            <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-lg shadow-sky-100/40">

              <div className="flex items-center gap-3 mb-4">

                <Mountain className="w-7 h-7 text-sky-500" />

                <div>

                  <p className="text-xs uppercase tracking-wide text-sky-600 font-semibold">

                    Okemo Valley • Vermont

                  </p>

                  <p className="text-sm text-slate-500">

                    Perfect for ski trips & winter rentals

                  </p>

                </div>

              </div>

              <div className="space-y-3 text-sm">

                <div className="flex items-start gap-3">

                  <Home className="w-4 h-4 text-sky-500 mt-0.5" />

                  <div>

                    <p className="font-semibold text-slate-900">

                      Airbnb & Short-Term Rental Turnovers

                    </p>

                    <p className="text-slate-600">

                      Fast, reliable cleaning between guest stays — we handle

                      trash, bathrooms, kitchens, floors, and quick resets.

                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-3">

                  <BedDouble className="w-4 h-4 text-sky-500 mt-0.5" />

                  <div>

                    <p className="font-semibold text-slate-900">

                      Linen & Bedding Support

                    </p>

                    <p className="text-slate-600">

                      Optional add-on for fresh sheets, towels, and bed

                      make-ups to keep guests comfortable and reviews high.

                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-3">

                  <Snowflake className="w-4 h-4 text-sky-500 mt-0.5" />

                  <div>

                    <p className="font-semibold text-slate-900">

                      Deep Winter Cleaning

                    </p>

                    <p className="text-slate-600">

                      Tackle salt, snow, mud, and fireplace dust with seasonal

                      deep cleans before or after ski season.

                    </p>

                  </div>

                </div>

              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">

                <span>Locally operated from Ludlow, VT</span>

                <span>Built for ski season demand</span>

              </div>

            </div>

          </div>

        </section>

        {/* Services */}

        <section className="space-y-6">

          <div className="flex items-center gap-2">

            <Sparkles className="w-5 h-5 text-sky-500" />

            <h2 className="text-2xl font-semibold text-slate-900">

              Vermont Cleaning Services

            </h2>

          </div>

          <p className="text-slate-600 max-w-3xl">

            Whether you&apos;re managing a ski rental, hosting guests on Airbnb,

            or maintaining a second home in the Okemo Valley, VelocityMaid

            offers structured cleaning services that fit your schedule and

            standards.

          </p>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-2 mb-2">

                <Home className="w-5 h-5 text-sky-500" />

                <h3 className="font-semibold text-slate-900">

                  Rental Turnover Cleaning

                </h3>

              </div>

              <p className="text-sm text-slate-600 mb-3">

                Ideal for Airbnb, Vrbo, and ski-season rentals. Quick,

                consistent cleaning between check-out and check-in.

              </p>

              <ul className="text-xs text-slate-600 space-y-1">

                <li>• Bathrooms & kitchens disinfected</li>

                <li>• Floors vacuumed & mopped</li>

                <li>• Trash removed & bins reset</li>

                <li>• Light staging & guest-ready touches</li>

              </ul>

            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-2 mb-2">

                <Snowflake className="w-5 h-5 text-sky-500" />

                <h3 className="font-semibold text-slate-900">

                  Deep Winter / Seasonal Cleans

                </h3>

              </div>

              <p className="text-sm text-slate-600 mb-3">

                Before or after the ski season, we reset your space with a

                detailed deep clean.

              </p>

              <ul className="text-xs text-slate-600 space-y-1">

                <li>• Baseboards, edges, and corners</li>

                <li>• High-touch surfaces & appliances</li>

                <li>• Dust & cobweb removal</li>

                <li>• Entryways & mudroom refresh</li>

              </ul>

            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-2 mb-2">

                <BedDouble className="w-5 h-5 text-sky-500" />

                <h3 className="font-semibold text-slate-900">

                  Second Home & Condo Care

                </h3>

              </div>

              <p className="text-sm text-slate-600 mb-3">

                Scheduled visits to keep your Vermont home fresh, even when

                you&apos;re out of town.

              </p>

              <ul className="text-xs text-slate-600 space-y-1">

                <li>• Monthly or bi-weekly cleans</li>

                <li>• Pre-arrival and post-departure visits</li>

                <li>• Optional photo confirmations</li>

              </ul>

            </div>

          </div>

        </section>

        {/* Service Area & How It Works */}

        <section className="grid md:grid-cols-2 gap-10 items-start">

          <div className="space-y-4">

            <div className="flex items-center gap-2">

              <MapPin className="w-5 h-5 text-sky-500" />

              <h2 className="text-2xl font-semibold text-slate-900">

                Service Area — Vermont

              </h2>

            </div>

            <p className="text-slate-600 text-sm">

              VelocityMaid currently serves the Okemo Valley region:

            </p>

            <ul className="text-sm text-slate-700 space-y-1">

              <li>• Ludlow</li>

              <li>• Okemo Mountain area</li>

              <li>• Proctorsville</li>

              <li>• Cavendish</li>

              <li>• Nearby ski rentals and second homes</li>

            </ul>

            <p className="text-xs text-slate-500 mt-2">

              Have a property slightly outside this area? Reach out using the

              contact form — we&apos;ll let you know if we can accommodate your

              location.

            </p>

          </div>

          <div className="space-y-4">

            <div className="flex items-center gap-2">

              <Clock className="w-5 h-5 text-sky-500" />

              <h2 className="text-2xl font-semibold text-slate-900">

                How It Works

              </h2>

            </div>

            <ol className="space-y-3 text-sm text-slate-700">

              <li>

                <span className="font-semibold text-slate-900">1. Book:</span>{' '}

                Use our online booking form and select{' '}

                <span className="font-medium text-sky-700">Vermont</span> as

                your service location.

              </li>

              <li>

                <span className="font-semibold text-slate-900">2. Confirm:</span>{' '}

                You&apos;ll receive email and SMS/WhatsApp confirmation with all

                details.

              </li>

              <li>

                <span className="font-semibold text-slate-900">

                  3. We Clean:

                </span>{' '}

                Our trusted cleaners arrive within the agreed window, complete

                your checklist, and leave the space guest-ready.

              </li>

              <li>

                <span className="font-semibold text-slate-900">

                  4. Follow-Up:

                </span>{' '}

                You&apos;ll receive a short follow-up to confirm everything met

                your expectations.

              </li>

            </ol>

          </div>

        </section>

        {/* CTA & Contact */}

        <section className="rounded-3xl border border-sky-100 bg-sky-50/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 mb-2">

              Ready for ski season?

            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mb-2">

              Let&apos;s get your Vermont property guest-ready.

            </h2>

            <p className="text-sm text-slate-600 max-w-xl">

              Whether you&apos;re hosting every weekend or visiting a few times

              a year, VelocityMaid helps keep your space clean, welcoming, and

              ready on arrival.

            </p>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

            <Link

              href="/booking?location=vermont"

              className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"

            >

              Book Vermont Cleaning

            </Link>

            <a

              href="https://wa.me/18027335348"

              target="_blank"

              rel="noreferrer"

              className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-full border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-50 transition"

            >

              Chat on WhatsApp

            </a>

          </div>

        </section>

        {/* Footer Info */}

        <section className="border-t border-slate-200 pt-6 text-xs text-slate-500 space-y-1">

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





