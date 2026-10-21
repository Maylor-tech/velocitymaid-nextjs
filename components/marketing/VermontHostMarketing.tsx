import { CheckCircle2 } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { PropertyGalleryPreview } from "@/components/marketing/PropertyGalleryPreview";
import { MarketingTestimonials } from "@/components/marketing/MarketingTestimonials";
import { AfterTheClean } from "@/components/marketing/AfterTheClean";
import {
  LUDLOW_CARD_IMAGES,
  MIDDLEBURY_CARD_IMAGES,
  PERKINSVILLE_CARD_IMAGES,
} from "@/lib/vermont/middleburyPhotos";
import { VERMONT_TESTIMONIALS } from "@/lib/marketing/testimonials";
import { VERMONT_SUPPORT } from "@/lib/customer/marketSupport";
import { VERMONT_TURNOVER_QUOTE_LABEL } from "@/lib/marketing/publicCtas";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";
const outlineNavyButton =
  "inline-flex items-center justify-center rounded-md border border-vm-border px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:border-vm-cyan hover:text-vm-cyan-dark";

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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
      {children}
    </p>
  );
}

function PricingCards() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {vtPricing.map((card) => (
        <article
          key={card.name}
          className={`relative rounded-xl border bg-white p-6 ${
            card.featured ? "border-vm-cyan shadow-lg" : "border-vm-border"
          }`}
        >
          {card.featured && (
            <span className="absolute -top-3 left-5 rounded-full bg-vm-cyan px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-vm-navy">
              Most common
            </span>
          )}
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
  );
}

export function VermontHostMarketing({ children }: { children: React.ReactNode }) {
  const phoneHref = `tel:+1${VERMONT_SUPPORT.phoneTel}`;
  const emailHref = `mailto:${VERMONT_SUPPORT.email}`;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main>
        <section className="bg-vm-navy px-5 py-16 text-center sm:py-20">
          <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vm-cyan">
            Vermont — Okemo Valley and Middlebury
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            Guest-ready properties, <span className="text-vm-cyan">every turnover.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body leading-relaxed text-white/65">
            We help Vermont hosts keep their properties guest-ready between stays through
            documented turnovers, property-specific standards, and local operational support.
          </p>
          <div className="mt-8">
            <a href="#host-intake" className={primaryButton}>
              {VERMONT_TURNOVER_QUOTE_LABEL}
            </a>
          </div>
        </section>

        <AfterTheClean />

        <PropertyGalleryPreview
          title="Vermont Properties We Service"
          description="Recent turnovers and property-readiness work. Photography is published only with each owner's approval."
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
        />

        <MarketingTestimonials
          testimonials={VERMONT_TESTIMONIALS}
          subtitle="Feedback from Vermont hosts after guest-ready turnovers."
        />

        <section className="px-5 py-16">
          <div className="mx-auto max-w-5xl text-center">
            <Eyebrow>Turnover pricing</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">
              Straightforward, Starting-At Pricing
            </h2>
            <div className="mt-9 text-left">
              <PricingCards />
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {[
                "Fridge interior — $25",
                "Oven interior — $30",
                "Laundry — $15",
                "Interior windows — from $20",
                "Delivery / pickup — from $75",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-vm-border bg-vm-surface px-4 py-2 font-body text-xs text-vm-text"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl font-body text-xs italic leading-relaxed text-vm-muted">
              Every property is different. Final pricing is confirmed after reviewing the
              property, service scope, schedule, condition, and requested services. Deposits
              may apply for deep cleans, large properties, and first-time clients.
            </p>
          </div>
        </section>

        <section
          id="walkthrough"
          className="scroll-mt-20 border-y border-vm-border bg-white px-5 py-14"
        >
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Talk with VelocityMaid</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-vm-navy">
              Request a walkthrough or quote
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-vm-muted">
              Speak with us before filling out a form—or share property details when you are
              ready. We will confirm scope, timing, and pricing for your home.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <a href={phoneHref} className={primaryButton}>
                Call or text {VERMONT_SUPPORT.phoneDisplay}
              </a>
              <a href={emailHref} className={outlineNavyButton}>
                Email {VERMONT_SUPPORT.email}
              </a>
              {VERMONT_SUPPORT.whatsappUrl ? (
                <a
                  href={VERMONT_SUPPORT.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={outlineNavyButton}
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
            <p className="mt-5 font-body text-xs text-vm-muted">
              <a href="#host-intake" className="font-semibold text-vm-navy hover:text-vm-cyan-dark">
                Complete property intake →
              </a>
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
