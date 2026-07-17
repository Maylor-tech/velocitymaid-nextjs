import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { PropertyGalleryPreview } from "@/components/marketing/PropertyGalleryPreview";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";
const outlineButton =
  "inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-white transition hover:border-vm-cyan hover:text-vm-cyan";

const vtPricing = [
  {
    name: "Standard Turnover",
    price: "$225",
    detail: "1–3 bedroom properties",
    items: ["Kitchen and bathrooms", "Bed reset and trash removal", "Guest-ready inspection"],
  },
  {
    name: "Large Property Turnover",
    price: "$275",
    detail: "4+ bedrooms or extended cleaning",
    items: ["Everything in Standard", "Additional guest areas", "Extended service time"],
    featured: true,
  },
  {
    name: "Deep Cleaning",
    price: "$325",
    detail: "Seasonal or first-time cleans",
    items: ["Inside appliances", "Baseboards and high dusting", "Detailed floor care"],
  },
];

const defaultNjPricing = [
  {
    name: "Standard Residential",
    price: "$120",
    detail: "Recurring or one-time cleaning",
    items: ["Kitchen and bathrooms", "Dusting, vacuuming, mopping", "Surface sanitization"],
    featured: true,
  },
  {
    name: "Deep Cleaning",
    price: "$220",
    detail: "First-time or seasonal cleans",
    items: ["Everything in Standard", "Baseboards and high dusting", "Detailed kitchen and bath"],
  },
  {
    name: "Move-In / Move-Out",
    price: "$220",
    detail: "Property-specific pricing",
    items: ["Full property reset", "Detailed floor cleaning", "Appliance exteriors"],
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
      {children}
    </p>
  );
}

function PricingCards({
  cards,
  accent = "cyan",
}: {
  cards: typeof vtPricing;
  accent?: "cyan" | "progress";
}) {
  const border = accent === "cyan" ? "border-vm-cyan" : "border-vm-progress";
  const badge = accent === "cyan" ? "bg-vm-cyan text-vm-navy" : "bg-vm-progress text-white";
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.name}
          className={`relative rounded-xl border bg-white p-6 ${
            card.featured ? `${border} shadow-lg` : "border-vm-border"
          }`}
        >
          {card.featured && (
            <span className={`absolute -top-3 left-5 rounded-full px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wide ${badge}`}>
              Most common
            </span>
          )}
          <h3 className="font-heading text-lg font-bold text-vm-navy">{card.name}</h3>
          <p className="mt-2 font-heading text-3xl font-bold text-vm-navy">
            {card.price} <span className="font-body text-xs font-medium text-vm-muted">starting</span>
          </p>
          <p className="mt-2 font-body text-xs text-vm-muted">{card.detail}</p>
          <ul className="mt-5 space-y-2">
            {card.items.map((item) => (
              <li key={item} className="flex gap-2 font-body text-sm text-vm-text">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-vm-cyan-dark" />
                {item}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function ValueStrip({
  items,
}: {
  items: Array<{ title: string; text: string; icon: React.ComponentType<{ className?: string }> }>;
}) {
  return (
    <section className="border-b border-vm-border bg-white">
      <div className="mx-auto grid max-w-marketing grid-cols-2 md:grid-cols-4">
        {items.map(({ title, text, icon: Icon }) => (
          <div key={title} className="border-r border-vm-border p-5 text-center last:border-r-0 sm:p-7">
            <span className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-vm-cyan-tint">
              <Icon className="h-4 w-4 text-vm-cyan-dark" />
            </span>
            <h3 className="font-heading text-sm font-bold text-vm-navy">{title}</h3>
            <p className="mt-1 font-body text-xs leading-relaxed text-vm-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomepageMockup() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader homeAnchors bookingHref="/book?branch=new-jersey" />
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
              <Link href="/book?branch=new-jersey" className={primaryButton}>Book now</Link>
              <Link href="/vermont/host-intake" className={outlineButton}>Request a quote</Link>
            </div>
          </div>
        </section>

        <div className="border-b border-vm-border bg-vm-surface">
          <div className="mx-auto flex max-w-marketing flex-wrap justify-center gap-x-12 gap-y-3 px-5 py-6">
            {["Professional teams", "Reliable scheduling", "Hospitality-level service", "Local support"].map((item) => (
              <span key={item} className="flex items-center gap-2 font-body text-sm font-semibold text-vm-navy">
                <span className="h-2 w-2 rounded-full bg-vm-cyan" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <section id="services" className="grid md:grid-cols-2">
          <article className="px-6 py-14 sm:px-12 lg:px-20">
            <Eyebrow>Vermont</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">For Hosts &amp; Property Managers</h2>
            <p className="mt-4 max-w-xl font-body leading-relaxed text-vm-muted">
              Vacation rental turnovers, deep cleaning, and property readiness for
              Airbnb hosts and second-home owners across the Okemo Valley and Middlebury.
            </p>
            <ul className="my-6 space-y-2 font-body text-sm text-vm-text">
              {["Vacation rental turnovers", "Deep cleaning and property resets", "Guest-ready inspections"].map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-vm-cyan-dark" />{item}</li>
              ))}
            </ul>
            <Link href="/vermont/host-intake" className={primaryButton}>Host intake</Link>
          </article>
          <article className="bg-vm-surface px-6 py-14 sm:px-12 lg:px-20">
            <Eyebrow>New Jersey</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">For Homes &amp; Apartments</h2>
            <p className="mt-4 max-w-xl font-body leading-relaxed text-vm-muted">
              Recurring residential cleaning for homeowners, apartment residents,
              and busy professionals across Newark, Jersey City, and Paterson.
            </p>
            <ul className="my-6 space-y-2 font-body text-sm text-vm-text">
              {["Recurring cleaning", "Deep cleaning", "Move-in and move-out"].map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-vm-cyan-dark" />{item}</li>
              ))}
            </ul>
            <Link href="/book?branch=new-jersey" className={primaryButton}>Book cleaning</Link>
          </article>
        </section>

        <PropertyGalleryPreview
          items={[
            { name: "Fern Hill", location: "Perkinsville, VT" },
            { name: "Bear Hill", location: "Ludlow, VT" },
            { name: "Chipman Park", location: "Middlebury, VT" },
          ]}
          description="The gallery structure is ready. Client property photography remains private until publication permission is confirmed."
        />
      </main>
      <Footer />
    </div>
  );
}

export function VermontHostMarketing({ children }: { children: React.ReactNode }) {
  const values = [
    { title: "Reliable Scheduling", text: "Built around guest turnovers", icon: Clock3 },
    { title: "Guest-Ready Checks", text: "Inspected before completion", icon: ShieldCheck },
    { title: "Same-Day Flips", text: "Available during peak season", icon: CalendarDays },
    { title: "Host Communication", text: "Direct updates, no guesswork", icon: Home },
  ];
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader bookingHref="#host-intake" bookingLabel="Host Intake" />
      <main>
        <section className="bg-vm-navy px-5 py-16 text-center sm:py-20">
          <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">Vermont — Okemo Valley &amp; Middlebury</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            Guest-ready properties, <span className="text-vm-cyan">every turnover.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body leading-relaxed text-white/65">
            Vacation rental turnovers, deep cleaning, and property readiness for
            Airbnb hosts, property managers, and second-home owners.
          </p>
          <Link href="#host-intake" className={`${primaryButton} mt-8`}>Host intake</Link>
        </section>
        <ValueStrip items={values} />
        <PropertyGalleryPreview
          title="Vermont Properties We Service"
          description="A staged preview for recent turnovers and property-readiness work. Photography will remain private until each owner approves publication."
          items={[
            { name: "Fern Hill", location: "Perkinsville, VT" },
            { name: "Bear Hill", location: "Ludlow, VT" },
            { name: "Chipman Park", location: "Middlebury, VT" },
          ]}
        />
        <section className="px-5 py-16">
          <div className="mx-auto max-w-5xl text-center">
            <Eyebrow>Turnover pricing</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">Straightforward, Starting-At Pricing</h2>
            <div className="mt-9 text-left"><PricingCards cards={vtPricing} /></div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {["Fridge interior — $25", "Oven interior — $30", "Laundry — $15", "Interior windows — from $20", "Delivery / pickup — from $75"].map((item) => (
                <span key={item} className="rounded-full border border-vm-border bg-vm-surface px-4 py-2 font-body text-xs text-vm-text">{item}</span>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl font-body text-xs italic leading-relaxed text-vm-muted">
              Final pricing is confirmed after a brief walkthrough or quote review.
              Deposits may apply for deep cleans, large properties, and first-time clients.
            </p>
          </div>
        </section>
        <section id="host-intake" className="scroll-mt-20 bg-vm-surface px-5 py-16">
          {children}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export type NewJerseyMarketingProps = {
  pricing?: {
    standard: number;
    deep: number;
    moveInOut: number;
  };
  promo?: {
    title: string;
    description: string;
    bookingHref: string;
  } | null;
};

export function NewJerseyBookingMockup({
  pricing = { standard: 120, deep: 220, moveInOut: 220 },
  promo = null,
}: NewJerseyMarketingProps) {
  const njPricing = defaultNjPricing.map((card, index) => ({
    ...card,
    price: `$${[pricing.standard, pricing.deep, pricing.moveInOut][index]}`,
  }));
  const values = [
    { title: "Flexible Scheduling", text: "Weekly, biweekly, or one-time", icon: CalendarDays },
    { title: "Trusted Professionals", text: "Vetted, respectful teams", icon: ShieldCheck },
    { title: "Satisfaction Promise", text: "24-hour review window", icon: CheckCircle2 },
    { title: "On-Time Service", text: "Reliable arrival windows", icon: Clock3 },
  ];
  return (
    <div className="min-h-screen bg-white">
      {promo && (
        <aside className="border-b border-vm-cyan/30 bg-vm-cyan-tint px-5 py-3">
          <div className="mx-auto flex max-w-marketing flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-heading text-sm font-bold text-vm-navy">{promo.title}</p>
              <p className="mt-1 font-body text-xs text-vm-muted">{promo.description}</p>
            </div>
            <Link href={promo.bookingHref} className={primaryButton}>
              Book cleaning
            </Link>
          </div>
        </aside>
      )}
      <SiteHeader
        bookingHref="/book?branch=new-jersey"
        bookingLabel="Book Cleaning"
      />
      <main>
        <section className="bg-vm-navy px-5 py-16 text-center sm:py-20">
          <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">New Jersey — Newark, Jersey City &amp; Paterson</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            A clean home, <span className="text-vm-cyan">on your schedule.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body leading-relaxed text-white/65">
            Reliable residential cleaning for homeowners, apartment residents,
            and busy professionals—recurring or one-time.
          </p>
          <Link href="/book?branch=new-jersey" className={`${primaryButton} mt-8`}>Book cleaning</Link>
        </section>
        <ValueStrip items={values} />
        <section className="bg-vm-surface px-5 py-16 text-center">
          <Eyebrow>Recurring plans</Eyebrow>
          <h2 className="font-heading text-3xl font-bold text-vm-navy">Set It and Forget It</h2>
          <p className="mt-3 font-body text-sm text-vm-muted">Choose a cadence that fits your household.</p>
          <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-3">
            {[
              ["Weekly", "Every week, same day", "Best for active households and consistent upkeep."],
              ["Biweekly", "Every two weeks", "Our most popular balance of cost and consistency."],
              ["Monthly", "Once a month", "A deeper refresh for lower-traffic homes."],
            ].map(([name, frequency, text]) => (
              <article key={name} className="rounded-xl border border-vm-border bg-white p-6 text-left">
                <h3 className="font-heading text-lg font-bold text-vm-navy">{name}</h3>
                <p className="mt-1 font-body text-xs text-vm-muted">{frequency}</p>
                <p className="mt-4 font-body text-sm leading-relaxed text-vm-text">{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="px-5 py-16">
          <div className="mx-auto max-w-5xl text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">Straightforward, Starting-At Pricing</h2>
            <div className="mt-9 text-left"><PricingCards cards={njPricing} accent="progress" /></div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {["Fridge interior — $25", "Oven interior — $30", "Laundry — $15", "Interior windows — from $20"].map((item) => (
                <span key={item} className="rounded-full border border-vm-border bg-vm-surface px-4 py-2 font-body text-xs text-vm-text">{item}</span>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl font-body text-xs italic leading-relaxed text-vm-muted">
              Final pricing is confirmed after a brief walkthrough or quote request.
              Deep cleans, large properties, first-time clients, and multi-day
              projects may require a deposit.
            </p>
          </div>
        </section>
        <section className="bg-vm-surface px-5 py-16 text-center">
          <div className="mx-auto max-w-xl rounded-xl border border-vm-border bg-white p-8">
            <Sparkles className="mx-auto h-9 w-9 text-vm-cyan-dark" />
            <h2 className="mt-4 font-heading text-2xl font-bold text-vm-navy">Book Cleaning</h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
              Tell us your address, service type, home details, and preferred date
              in our secure booking flow.
            </p>
            <Link href="/book?branch=new-jersey" className={`${primaryButton} mt-6 w-full`}>Book cleaning</Link>
          </div>
        </section>
        <p className="border-t border-vm-border px-5 py-5 text-center font-body text-xs text-vm-muted">
          Secure electronic payments powered by Stripe.
        </p>
      </main>
      <Footer />
    </div>
  );
}
