import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { PropertyGalleryPreview } from "@/components/marketing/PropertyGalleryPreview";
import { EditorialProof } from "@/components/marketing/EditorialProof";
import { MarketingTestimonials } from "@/components/marketing/MarketingTestimonials";
import { GuestReadyProcess } from "@/components/marketing/GuestReadyProcess";
import {
  LUDLOW_CARD_IMAGES,
  MIDDLEBURY_CARD_IMAGES,
  PERKINSVILLE_CARD_IMAGES,
} from "@/lib/vermont/middleburyPhotos";
import { HOMEPAGE_TESTIMONIALS } from "@/lib/marketing/testimonials";
import { HOMEPAGE_PROOF } from "@/lib/marketing/portfolio";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";
const outlineButton =
  "inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-white transition hover:border-vm-cyan hover:text-vm-cyan";
const outlineNavyButton =
  "inline-flex items-center justify-center rounded-md border border-vm-border px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:border-vm-cyan hover:text-vm-cyan-dark";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
      {children}
    </p>
  );
}

const homepageFaqs = [
  {
    question: "Do you serve both Vermont and New Jersey?",
    answer:
      "Yes. Vermont service focuses on vacation rentals, turnovers, and property readiness. New Jersey service focuses on residential cleaning for homes and apartments.",
  },
  {
    question: "How is final pricing confirmed?",
    answer:
      "Website prices are starting points. We confirm the final scope and price after reviewing your home, property, schedule, and requested services.",
  },
  {
    question: "What happens after I contact VelocityMaid?",
    answer:
      "For Vermont hosts, we review your property details, discuss a walkthrough or quote, and set a property-specific service standard before scheduled turnovers begin. New Jersey customers can book online and confirm scope before service.",
  },
  {
    question: "Can you work around guest check-in times?",
    answer:
      "Yes. Vermont turnover scheduling is planned around checkout and check-in windows, with direct host communication throughout the service.",
  },
  {
    question: "How do I get started?",
    answer:
      "New Jersey customers can book online. Vermont hosts can request a walkthrough or quote, call or text (802) 733-5348, email hello@velocitymaid.com, or complete the host intake form.",
  },
];

export function HomepageMarketing() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader homeAnchors bookingHref="/lead/new-jersey" />
      <main>
        <section className="relative overflow-hidden bg-vm-navy px-5 py-20 text-center sm:py-24">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-vm-cyan/10 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">
              Vermont &amp; New Jersey
            </p>
            <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-6xl">
              Come Home to <span className="text-vm-cyan">Clean.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl font-body text-base leading-relaxed text-white/65 sm:text-lg">
              Professional home care and property readiness—hospitality-level standards
              for vacation rentals, hosts, and busy households.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/lead/new-jersey" className={primaryButton}>
                New Jersey quote
              </Link>
              <Link href="/vermont" className={outlineButton}>
                Vermont hosts →
              </Link>
            </div>
          </div>
        </section>

        <div className="border-b border-vm-border bg-vm-surface">
          <div className="mx-auto flex max-w-marketing flex-wrap justify-center gap-x-12 gap-y-3 px-5 py-6">
            {[
              "Real Vermont property care",
              "Guest-ready turnovers",
              "Property-specific standards",
              "Local operational support",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 font-body text-sm font-semibold text-vm-navy"
              >
                <span className="h-2 w-2 rounded-full bg-vm-cyan" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <section id="services" className="grid md:grid-cols-2">
          <article className="px-6 py-14 sm:px-12 lg:px-20">
            <Eyebrow>Vermont</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">
              For Hosts &amp; Property Managers
            </h2>
            <p className="mt-4 max-w-xl font-body leading-relaxed text-vm-muted">
              We help Vermont hosts keep properties guest-ready between stays through
              documented turnovers, property-specific standards, and local operational support.
            </p>
            <ul className="my-6 space-y-2 font-body text-sm text-vm-text">
              {[
                "Vacation rental turnovers",
                "Deep cleaning and property resets",
                "Guest-ready inspections",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-vm-cyan-dark" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/hosts" className={primaryButton}>
                Request Property Setup
              </Link>
              <Link href="/vermont" className={outlineNavyButton}>
                Explore Vermont
              </Link>
            </div>
          </article>
          <article className="bg-vm-surface px-6 py-14 sm:px-12 lg:px-20">
            <Eyebrow>New Jersey</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">
              For Homes &amp; Apartments
            </h2>
            <p className="mt-4 max-w-xl font-body leading-relaxed text-vm-muted">
              Recurring residential cleaning is our primary New Jersey offer —
              serving Bloomfield, Montclair, Newark, East Orange, Irvington,
              South Orange, West Orange, and Nutley.
            </p>
            <ul className="my-6 space-y-2 font-body text-sm text-vm-text">
              {[
                "Recurring residential cleaning",
                "Deep cleaning",
                "Move-in and move-out",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-vm-cyan-dark" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mb-4 font-body text-xs text-vm-muted">
              Short-term rental cleaning available on request.
            </p>
            <Link href="/lead/new-jersey" className={primaryButton}>
              Request a quote
            </Link>
          </article>
        </section>

        <GuestReadyProcess tone="light" />

        <section id="why-us" className="scroll-mt-20 bg-vm-navy px-5 py-16">
          <div className="mx-auto max-w-marketing text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan">
              Why VelocityMaid
            </p>
            <h2 className="font-heading text-3xl font-bold text-white">
              Professional care you can rely on
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-white/65">
              Clear expectations, dependable scheduling, and property-ready results
              across every market we serve.
            </p>
            <div className="mt-9 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Trusted Service",
                  text: "Respectful teams and clear service standards.",
                  icon: ShieldCheck,
                },
                {
                  title: "Reliable Scheduling",
                  text: "Arrival windows planned around your priorities.",
                  icon: Clock3,
                },
                {
                  title: "Property-Ready Detail",
                  text: "Careful resets for homes, rentals, and guest spaces.",
                  icon: CheckCircle2,
                },
                {
                  title: "Convenient Support",
                  text: "Simple booking, walkthrough requests, and direct communication.",
                  icon: CalendarDays,
                },
              ].map(({ title, text, icon: Icon }) => (
                <article key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <Icon className="h-5 w-5 text-vm-cyan" />
                  <h3 className="mt-4 font-heading text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-white/60">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <EditorialProof
          id="our-work"
          eyebrow="Proof of work"
          heading="Real Homes. Guest-Ready Results."
          copy="From vacation-rental turnovers to detailed residential cleaning, VelocityMaid prepares homes with the care, consistency and attention to detail owners and guests expect."
          featured={HOMEPAGE_PROOF.featured}
          supporting={HOMEPAGE_PROOF.supporting}
          actions={
            <>
              <Link href="/gallery" className={primaryButton}>
                View Our Work
              </Link>
              <Link href="/vermont/host-intake" className={outlineButton}>
                Request a Quote
              </Link>
            </>
          }
        />

        <PropertyGalleryPreview
          items={[
            {
              name: "Fern Hill",
              location: "Perkinsville, VT",
              images: PERKINSVILLE_CARD_IMAGES,
              permissionGranted: true,
            },
            {
              name: "Ludlow, VT",
              location: "Okemo Valley",
              images: LUDLOW_CARD_IMAGES,
              permissionGranted: true,
            },
            {
              name: "Middlebury, VT",
              location: "Addison County",
              images: MIDDLEBURY_CARD_IMAGES,
              permissionGranted: true,
            },
          ]}
          description="Client property photography is published only with the owner's approval."
        />

        <section id="pricing" className="scroll-mt-20 bg-vm-surface px-5 py-16">
          <div className="mx-auto max-w-5xl text-center">
            <Eyebrow>Starting-at pricing</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">Choose your market</h2>
            <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
              Every property is different. Final pricing is confirmed after reviewing the
              property, service scope, schedule, condition, and requested services.
            </p>
            <div className="mt-9 grid gap-5 text-left md:grid-cols-2">
              <article className="rounded-xl border border-vm-border bg-white p-7">
                <p className="font-body text-xs font-bold uppercase tracking-wider text-vm-cyan-dark">
                  Vermont
                </p>
                <h3 className="mt-3 font-heading text-2xl font-bold text-vm-navy">
                  Vacation rental turnovers
                </h3>
                <p className="mt-3 font-heading text-3xl font-bold text-vm-navy">
                  $225{" "}
                  <span className="font-body text-xs font-medium text-vm-muted">starting</span>
                </p>
                <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
                  Guest-ready resets for hosts and property managers in the Okemo Valley,
                  Middlebury, and surrounding towns.
                </p>
                <Link href="/vermont/host-intake" className={`${primaryButton} mt-6`}>
                  Request a quote
                </Link>
              </article>
              <article className="rounded-xl border border-vm-border bg-white p-7">
                <p className="font-body text-xs font-bold uppercase tracking-wider text-vm-cyan-dark">
                  New Jersey
                </p>
                <h3 className="mt-3 font-heading text-2xl font-bold text-vm-navy">
                  Residential cleaning
                </h3>
                <p className="mt-3 font-heading text-3xl font-bold text-vm-navy">
                  Custom quote
                </p>
                <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
                  Recurring residential cleaning first, then deep cleans and
                  move-in/move-out — across Elaine&apos;s Essex County territory.
                  Pricing confirmed after review.
                </p>
                <Link href="/lead/new-jersey" className={`${primaryButton} mt-6`}>
                  Request a quote
                </Link>
              </article>
            </div>
            <p className="mt-6">
              <Link
                href="/pricing"
                className="font-heading text-xs font-bold uppercase tracking-wider text-vm-cyan-dark hover:underline"
              >
                Full pricing details →
              </Link>
            </p>
          </div>
        </section>

        <MarketingTestimonials
          testimonials={HOMEPAGE_TESTIMONIALS}
          subtitle="Real feedback from homeowners and hosts in Vermont and New Jersey."
        />

        <section id="faq" className="scroll-mt-20 bg-vm-surface px-5 py-16">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <Eyebrow>Frequently asked questions</Eyebrow>
              <h2 className="font-heading text-3xl font-bold text-vm-navy">
                Helpful answers before you book
              </h2>
            </div>
            <div className="mt-9 space-y-3">
              {homepageFaqs.map(({ question, answer }) => (
                <details
                  key={question}
                  className="group rounded-xl border border-vm-border bg-white p-5"
                >
                  <summary className="cursor-pointer list-none font-heading text-sm font-bold text-vm-navy">
                    {question}
                  </summary>
                  <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
