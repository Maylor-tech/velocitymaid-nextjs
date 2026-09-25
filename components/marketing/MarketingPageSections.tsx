import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import {
  NJ_LEAD_PATH,
  NJ_PRICING_PUBLIC_LABEL,
  NJ_PRICING_REVIEW_NOTE,
  NJ_PUBLIC_SERVICES,
  njCitiesHeroList,
  njCitiesShortList,
} from "@/lib/markets/newJersey";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
      {children}
    </p>
  );
}

function ServiceCards() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {NJ_PUBLIC_SERVICES.filter((s) => !("secondary" in s && s.secondary)).map(
        (card) => (
          <article
            key={card.key}
            className={`relative rounded-xl border bg-white p-6 ${
              card.featured ? "border-vm-progress shadow-lg" : "border-vm-border"
            }`}
          >
            {card.featured && (
              <span className="absolute -top-3 left-5 rounded-full bg-vm-progress px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-white">
                Primary offer
              </span>
            )}
            <h3 className="font-heading text-lg font-bold text-vm-navy">
              {card.name}
            </h3>
            <p className="mt-2 font-heading text-2xl font-bold text-vm-navy">
              {NJ_PRICING_PUBLIC_LABEL}
            </p>
            <p className="mt-2 font-body text-xs text-vm-muted">{card.detail}</p>
          </article>
        )
      )}
    </div>
  );
}

function ValueStrip({
  items,
}: {
  items: Array<{
    title: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}) {
  return (
    <section className="border-b border-vm-border bg-white">
      <div className="mx-auto grid max-w-marketing grid-cols-2 md:grid-cols-4">
        {items.map(({ title, text, icon: Icon }) => (
          <div
            key={title}
            className="border-r border-vm-border p-5 text-center last:border-r-0 sm:p-7"
          >
            <span className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-vm-cyan-tint">
              <Icon className="h-4 w-4 text-vm-cyan-dark" />
            </span>
            <h3 className="font-heading text-sm font-bold text-vm-navy">{title}</h3>
            <p className="mt-1 font-body text-xs leading-relaxed text-vm-muted">
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export type NewJerseyMarketingProps = {
  /** @deprecated Prices are not published during NJ pricing review. */
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

/** Active presentation component for app/new-jersey/page.tsx. */
export function NewJerseyBookingMockup({
  promo = null,
}: NewJerseyMarketingProps) {
  const values = [
    {
      title: "Flexible Scheduling",
      text: "Weekly, biweekly, or one-time",
      icon: CalendarDays,
    },
    {
      title: "Trusted Professionals",
      text: "Vetted, respectful teams",
      icon: ShieldCheck,
    },
    {
      title: "Satisfaction Promise",
      text: "24-hour review window",
      icon: CheckCircle2,
    },
    {
      title: "On-Time Service",
      text: "Reliable arrival windows",
      icon: Clock3,
    },
  ];
  const strNote = NJ_PUBLIC_SERVICES.find((s) => s.key === "str");

  return (
    <div className="min-h-screen bg-white">
      {promo && (
        <aside className="border-b border-vm-cyan/30 bg-vm-cyan-tint px-5 py-3">
          <div className="mx-auto flex max-w-marketing flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-heading text-sm font-bold text-vm-navy">
                {promo.title}
              </p>
              <p className="mt-1 font-body text-xs text-vm-muted">
                {promo.description}
              </p>
            </div>
            <Link href={NJ_LEAD_PATH} className={primaryButton}>
              Request a quote
            </Link>
          </div>
        </aside>
      )}
      <SiteHeader bookingHref={NJ_LEAD_PATH} bookingLabel="Request a Quote" />
      <main>
        <section className="bg-vm-navy px-5 py-16 text-center sm:py-20">
          <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">
            New Jersey — {njCitiesHeroList()}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            Recurring home cleaning,{" "}
            <span className="text-vm-cyan">on your schedule.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body leading-relaxed text-white/65">
            VelocityMaid serves Bloomfield, Montclair, Newark, East Orange,
            Irvington, South Orange, West Orange, and Nutley. Recurring
            residential cleaning is our primary offer — with deep cleans and
            move-in/move-out when you need them.
          </p>
          <Link href={NJ_LEAD_PATH} className={`${primaryButton} mt-8`}>
            Request a quote
          </Link>
        </section>

        <ValueStrip items={values} />

        <section id="nj-proof" className="bg-vm-navy px-5 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan">
              Service area
            </p>
            <h2 className="font-heading text-3xl font-bold text-white">
              Elaine&apos;s New Jersey territory
            </h2>
            <p className="mt-4 font-body text-sm leading-relaxed text-white/65">
              {njCitiesShortList()}. Local follow-up from our New Jersey
              operations lead — quoting, payment, and your customer record stay
              with VelocityMaid.
            </p>
            <Link href={NJ_LEAD_PATH} className={`${primaryButton} mt-8`}>
              Request a quote
            </Link>
          </div>
        </section>

        <section className="bg-vm-surface px-5 py-16 text-center">
          <Eyebrow>Recurring plans</Eyebrow>
          <h2 className="font-heading text-3xl font-bold text-vm-navy">
            Set It and Forget It
          </h2>
          <p className="mt-3 font-body text-sm text-vm-muted">
            Choose a cadence that fits your household — our primary New Jersey
            offer.
          </p>
          <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-3">
            {[
              [
                "Weekly",
                "Every week, same day",
                "Best for active households and consistent upkeep.",
              ],
              [
                "Biweekly",
                "Every two weeks",
                "Our most popular balance of consistency and flexibility.",
              ],
              [
                "Monthly",
                "Once a month",
                "A deeper refresh for lower-traffic homes.",
              ],
            ].map(([name, frequency, text]) => (
              <article
                key={name}
                className="rounded-xl border border-vm-border bg-white p-6 text-left"
              >
                <h3 className="font-heading text-lg font-bold text-vm-navy">
                  {name}
                </h3>
                <p className="mt-1 font-body text-xs text-vm-muted">
                  {frequency}
                </p>
                <p className="mt-4 font-body text-sm leading-relaxed text-vm-text">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-5 py-16">
          <div className="mx-auto max-w-5xl text-center">
            <Eyebrow>Services</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">
              What we offer in New Jersey
            </h2>
            <p className="mx-auto mt-3 max-w-2xl font-body text-sm text-vm-muted">
              {NJ_PRICING_REVIEW_NOTE}
            </p>
            <div className="mt-9 text-left">
              <ServiceCards />
            </div>
            {strNote && (
              <p className="mx-auto mt-8 max-w-2xl rounded-lg border border-vm-border bg-vm-surface px-4 py-3 font-body text-xs text-vm-muted">
                <strong className="text-vm-navy">{strNote.name}.</strong>{" "}
                {strNote.detail}
              </p>
            )}
          </div>
        </section>

        <section className="bg-vm-surface px-5 py-16 text-center">
          <div className="mx-auto max-w-xl rounded-xl border border-vm-border bg-white p-8">
            <Sparkles className="mx-auto h-9 w-9 text-vm-cyan-dark" />
            <h2 className="mt-4 font-heading text-2xl font-bold text-vm-navy">
              Request a Quote
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
              Share your contact info, property location, service type, home
              details, frequency, and preferred date. We&apos;ll follow up to
              confirm your custom quote.
            </p>
            <Link href={NJ_LEAD_PATH} className={`${primaryButton} mt-6 w-full`}>
              Get your free quote
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
