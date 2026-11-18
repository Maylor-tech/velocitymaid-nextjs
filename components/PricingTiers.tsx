import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { HomeWatchLinkCard } from "@/components/marketing/HomeWatchLinkCard";

const primaryButton =
  "inline-flex min-h-[44px] items-center justify-center rounded-md bg-vm-cyan px-5 py-2.5 font-heading text-sm font-bold text-vm-navy transition hover:bg-vm-cyan/90";

const markets = [
  {
    market: "Vermont",
    title: "Vacation rental turnovers",
    priceLine: "Flat price by bedroom count — see the table above.",
    detail:
      "Guest-ready resets for hosts and property managers in the Okemo Valley, Middlebury, and surrounding towns.",
    href: "/vermont/host-intake",
    cta: "Book a turnover",
  },
  {
    market: "New Jersey",
    title: "Recurring residential cleaning",
    priceLine: "Get a quote — we reply within one business day.",
    detail:
      "Primary offer for Bloomfield, Montclair, Newark, East Orange, Irvington, South Orange, West Orange, and Nutley — plus deep cleans and move-in/move-out. Pricing confirmed after review.",
    href: "/lead/new-jersey",
    cta: "Get a Free Quote",
  },
] as const;

const vermontTiers = [
  {
    name: "Standard Turnover",
    detail: "2–4 bedrooms · from the table above",
    items: [
      "Kitchen and bathrooms",
      "Bed reset and trash removal",
      "Photo report according to your booked service package.",
    ],
  },
  {
    name: "Large Property Turnover",
    detail: "Large 4 bedroom or 5+ bedrooms",
    items: ["Everything in Standard", "Additional guest areas", "Extended service time"],
    featured: true,
  },
  {
    name: "Deep Cleaning",
    detail: "Seasonal or first-time cleans",
    items: ["Inside appliances", "Baseboards and high dusting", "Detailed floor care"],
  },
] as const;

export default function PricingTiers() {
  return (
    <div className="space-y-14">
      <div>
        <h2 className="font-heading text-2xl font-bold text-vm-navy sm:text-3xl">
          Choose your market
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {markets.map((card) => (
            <article
              key={card.market}
              className="rounded-xl border border-vm-border bg-white p-7 shadow-sm"
            >
              <p className="font-body text-xs font-bold uppercase tracking-wider text-vm-cyan-dark">
                {card.market}
              </p>
              <h3 className="mt-3 font-heading text-2xl font-bold text-vm-navy">{card.title}</h3>
              <p className="mt-3 font-body text-base font-semibold leading-relaxed text-vm-navy">
                {card.priceLine}
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">{card.detail}</p>
              <Link href={card.href} className={`${primaryButton} mt-6`}>
                {card.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-2xl font-bold text-vm-navy sm:text-3xl">
          Vermont services
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {vermontTiers.map((card) => (
            <article
              key={card.name}
              className={`relative rounded-xl border bg-white p-6 shadow-sm ${
                "featured" in card && card.featured
                  ? "border-vm-cyan shadow-lg"
                  : "border-vm-border"
              }`}
            >
              {"featured" in card && card.featured ? (
                <span className="absolute -top-3 left-5 rounded-full bg-vm-cyan px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-vm-navy">
                  Most common
                </span>
              ) : null}
              <h3 className="font-heading text-lg font-bold text-vm-navy">{card.name}</h3>
              <p className="mt-2 font-body text-sm font-semibold leading-relaxed text-vm-navy">
                {card.detail}
              </p>
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
        <div className="mt-8 max-w-3xl">
          <HomeWatchLinkCard />
        </div>
      </div>
    </div>
  );
}
