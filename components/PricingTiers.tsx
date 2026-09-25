import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";

const markets = [
  {
    market: "Vermont",
    title: "Vacation rental turnovers",
    price: "$225",
    detail:
      "Guest-ready resets for hosts and property managers in the Okemo Valley, Middlebury, and surrounding towns.",
    href: "/vermont/host-intake",
    cta: "Request a quote",
  },
  {
    market: "New Jersey",
    title: "Recurring residential cleaning",
    price: "Custom quote",
    detail:
      "Primary offer for Bloomfield, Montclair, Newark, East Orange, Irvington, South Orange, West Orange, and Nutley — plus deep cleans and move-in/move-out. Pricing confirmed after review.",
    href: "/lead/new-jersey",
    cta: "Request a quote",
  },
] as const;

const vermontTiers = [
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
] as const;

export default function PricingTiers() {
  return (
    <div className="space-y-14">
      <div>
        <h2 className="font-heading text-2xl font-bold text-vm-navy sm:text-3xl">
          Choose your market
        </h2>
        <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
          Every property is different. Final pricing is confirmed after reviewing the property,
          service scope, schedule, condition, and requested services.
        </p>
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
              <p className="mt-3 font-heading text-3xl font-bold text-vm-navy">
                {card.market === "New Jersey" ? (
                  card.price
                ) : (
                  <>
                    {card.price}{" "}
                    <span className="font-body text-xs font-medium text-vm-muted">
                      starting
                    </span>
                  </>
                )}
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
          Vermont turnover starting points
        </h2>
        <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
          Common service levels for Vermont hosts. These are planning guides—not fixed quotes.
        </p>
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
              <p className="mt-2 font-heading text-3xl font-bold text-vm-navy">
                {card.price}{" "}
                <span className="font-body text-xs font-medium text-vm-muted">starting</span>
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
        <p className="mt-6 font-body text-xs italic leading-relaxed text-vm-muted">
          Deposits may apply for deep cleans, large properties, and first-time clients.
          Internal cleaner payout rates are not published publicly.
        </p>
      </div>
    </div>
  );
}
