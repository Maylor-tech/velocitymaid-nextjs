// app/new-jersey/page.tsx

import { Metadata } from 'next';

import Link from 'next/link';

import {

  Home,

  Building2,

  Sparkles,

  MapPin,

  CheckCircle2,

  Clock,

  Phone,

  Mail,

  BedDouble,

  Shield,

} from 'lucide-react';



export const metadata: Metadata = {

  title: 'New Jersey Cleaning Services | VelocityMaid — Professional Home & Apartment Cleaning',

  description:

    'VelocityMaid provides reliable home cleaning, deep cleaning, and move-in/out cleaning services across New Jersey. Trusted by homeowners, renters, and property managers.',

};



export default function NewJerseyPage() {

  return (

    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">

      {/* Top Bar */}

      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2">

            <Sparkles className="w-6 h-6 text-sky-500" />

            <span className="font-semibold text-slate-900 text-lg">

              VelocityMaid

            </span>

          </Link>

          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-600">

            <div className="flex items-center gap-2">

              <Phone className="w-4 h-4" />

              <a href="tel:+18027335348" className="hover:text-sky-600">

                (802) 733-5348

              </a>

            </div>

            <div className="flex items-center gap-2">

              <Mail className="w-4 h-4" />

              <a href="mailto:hello@velocitymaid.com" className="hover:text-sky-600">

                hello@velocitymaid.com

              </a>

            </div>

            <Link

              href="/booking?location=new_jersey"

              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-sm transition"

            >

              Book NJ Cleaning

            </Link>

          </div>

        </div>

      </header>



      {/* PAGE CONTENT */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">

        {/* Hero Section */}

        <section className="grid md:grid-cols-2 gap-10 items-center">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 mb-4">

              <Sparkles className="w-3 h-3" />

              <span>New Jersey Branch</span>

            </div>



            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">

              Professional Home Cleaning Services Across{' '}

              <span className="text-sky-600">New Jersey</span>

            </h1>



            <p className="text-base sm:text-lg text-slate-600 mb-6">

              Reliable residential cleaning, apartment cleaning, deep cleaning, and move-in/out services for busy families, professionals, and rental property owners throughout New Jersey.

            </p>



            <div className="flex flex-wrap gap-3">

              <Link

                href="/booking?location=new_jersey"

                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"

              >

                Book NJ Cleaning

              </Link>

              <a

                href="https://wa.me/18027335348"

                className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 hover:border-sky-400 hover:bg-sky-50 transition"

              >

                Chat on WhatsApp

              </a>

            </div>

          </div>



          {/* Right-side Card */}

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-sky-100/40">

            <div className="flex items-center gap-3 mb-4">

              <Building2 className="w-7 h-7 text-sky-500" />

              <div>

                <p className="text-xs uppercase tracking-wide text-sky-600 font-semibold">

                  New Jersey Service Area

                </p>

                <p className="text-sm text-slate-500">

                  Trusted by homeowners & rental hosts

                </p>

              </div>

            </div>



            <div className="space-y-3 text-sm">

              <div className="flex items-start gap-3">

                <Home className="w-4 h-4 text-sky-500 mt-0.5" />

                <div>

                  <p className="font-semibold text-slate-900">

                    Home & Apartment Cleaning

                  </p>

                  <p className="text-slate-600">

                    Routine, deep, and one-time cleaning tailored to your home or apartment.

                  </p>

                </div>

              </div>



              <div className="flex items-start gap-3">

                <Sparkles className="w-4 h-4 text-sky-500 mt-0.5" />

                <div>

                  <p className="font-semibold text-slate-900">

                    Move-In / Move-Out Cleaning

                  </p>

                  <p className="text-slate-600">

                    Comprehensive cleaning for smooth transitions during moves or tenant changes.

                  </p>

                </div>

              </div>



              <div className="flex items-start gap-3">

                <BedDouble className="w-4 h-4 text-sky-500 mt-0.5" />

                <div>

                  <p className="font-semibold text-slate-900">

                    Add-On Services

                  </p>

                  <p className="text-slate-600">

                    Laundry, interior windows, oven cleaning, refrigerator cleaning.

                  </p>

                </div>

              </div>

            </div>



            <div className="mt-5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">

              <span>Serving all major NJ cities</span>

              <span>Fast online booking</span>

            </div>

          </div>

        </section>



        {/* Service Area */}

        <section className="space-y-4">

          <div className="flex items-center gap-2">

            <MapPin className="w-5 h-5 text-sky-500" />

            <h2 className="text-2xl font-semibold text-slate-900">

              New Jersey Service Area

            </h2>

          </div>



          <p className="text-slate-600 text-sm">

            VelocityMaid proudly serves the following New Jersey cities:

          </p>



          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-sm text-slate-700">

            <li>• Newark</li>

            <li>• East Orange</li>

            <li>• Irvington</li>

            <li>• Bloomfield</li>

            <li>• Jersey City</li>

            <li>• Elizabeth</li>

            <li>• Union</li>

            <li>• Montclair</li>

          </ul>

        </section>



        {/* Why Choose Us */}

        <section className="space-y-6">

          <div className="flex items-center gap-2">

            <Shield className="w-5 h-5 text-sky-500" />

            <h2 className="text-2xl font-semibold text-slate-900">

              Why Choose VelocityMaid in New Jersey?

            </h2>

          </div>



          <div className="grid md:grid-cols-3 gap-6">

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">

              <CheckCircle2 className="w-6 h-6 text-green-500" />

              <h3 className="font-semibold text-slate-900">Trusted by Homeowners</h3>

              <p className="text-sm text-slate-600">

                Reliable cleaning with consistent results and trusted staff.

              </p>

            </div>



            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">

              <CheckCircle2 className="w-6 h-6 text-green-500" />

              <h3 className="font-semibold text-slate-900">Fast Online Booking</h3>

              <p className="text-sm text-slate-600">

                Simple, quick scheduling with email, SMS, and WhatsApp confirmations.

              </p>

            </div>



            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">

              <CheckCircle2 className="w-6 h-6 text-green-500" />

              <h3 className="font-semibold text-slate-900">Premium Service Standards</h3>

              <p className="text-sm text-slate-600">

                Detailed cleaning checklists and reliable communication every step of the way.

              </p>

            </div>

          </div>

        </section>



        {/* How It Works */}

        <section className="grid md:grid-cols-2 gap-10 items-start">

          <div className="space-y-4">

            <div className="flex items-center gap-2">

              <Clock className="w-5 h-5 text-sky-500" />

              <h2 className="text-2xl font-semibold text-slate-900">How It Works</h2>

            </div>

            <ol className="space-y-3 text-sm text-slate-700">

              <li>

                <span className="font-semibold text-slate-900">1. Book:</span>{' '}

                Choose New Jersey on our booking page and select your service.

              </li>

              <li>

                <span className="font-semibold text-slate-900">2. Confirm:</span>{' '}

                You&apos;ll receive confirmations via email and WhatsApp.

              </li>

              <li>

                <span className="font-semibold text-slate-900">3. Clean:</span>{' '}

                Our cleaners arrive during the selected time window.

              </li>

              <li>

                <span className="font-semibold text-slate-900">4. Follow-Up:</span>{' '}

                Receive a brief follow-up for quality assurance.

              </li>

            </ol>

          </div>

        </section>



        {/* CTA */}

        <section className="rounded-3xl border border-sky-100 bg-sky-50/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 mb-2">

              Serving All of New Jersey

            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mb-2">

              Ready for a cleaner, fresher home?

            </h2>

            <p className="text-sm text-slate-600 max-w-xl">

              Whether you need weekly cleaning, a deep clean, or a move-out refresh,

              VelocityMaid is here to help.

            </p>

          </div>



          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

            <Link

              href="/booking?location=new_jersey"

              className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"

            >

              Book NJ Cleaning

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

          <p>VelocityMaid — New Jersey Cleaning Services</p>

          <p>Serving Newark, East Orange, Irvington, Bloomfield, Jersey City, Elizabeth, Union, Montclair, and nearby areas.</p>

          <p>Phone: (802) 733-5348 • Email: hello@velocitymaid.com</p>

        </section>

      </main>

    </div>

  );

}

