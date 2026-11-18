import Image from "next/image";
import { TrustStrip } from "@/components/vm/TrustStrip";
import { SiteHeader } from "@/components/vm/SiteHeader";
import { SiteFooter } from "@/components/vm/SiteFooter";
import { vmFocusRing } from "@/components/vm/focus";
import { cn } from "@/lib/utils";
import {
  LUDLOW_CARD_IMAGES,
  MIDDLEBURY_CARD_IMAGES,
  PERKINSVILLE_CARD_IMAGES,
} from "@/lib/vermont/middleburyPhotos";
import { reviewsForMarket } from "@/lib/marketing/reviews";
import { VERMONT_SUPPORT } from "@/lib/customer/marketSupport";
import { VermontTurnoverPrices } from "@/components/marketing/VermontTurnoverPrices";

const QUOTE_ANCHOR = "#get-quote";

const h2Class =
  "font-heading text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-[1.2] tracking-tight text-vm-navy";
const eyebrowClass =
  "font-body text-[13px] font-bold uppercase tracking-[0.13em]";

const ctaAccent = cn(
  "inline-flex min-h-[48px] items-center justify-center rounded-vm-md bg-vm-cyan px-[22px] py-3.5 font-heading text-base font-bold tracking-tight text-vm-navy hover:bg-vm-cyan/90",
  vmFocusRing
);
const ctaOutline = cn(
  "inline-flex min-h-[48px] items-center justify-center rounded-vm-md px-[22px] py-3.5 font-heading text-base font-bold tracking-tight text-vm-white shadow-[inset_0_0_0_1.5px_rgb(var(--vm-nav-text))] hover:bg-white/10",
  vmFocusRing
);
const contactLink = cn(
  "inline-flex min-h-touch items-center font-body text-base font-bold text-vm-cyan-dark hover:text-vm-navy",
  vmFocusRing
);

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="mt-1 shrink-0"
    >
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-vm-cyan-dark"
      />
    </svg>
  );
}

const reportRows = [
  { label: "Checklist", value: "Your property's list, completed" },
  { label: "Photos", value: "Room by room" },
  { label: "Noted during the clean", value: "Paper towels low" },
  { label: "Then", value: "One payment link" },
] as const;

const steps = [
  {
    n: "01",
    title: "Tell us about the property",
    body: "Two minutes. No card needed.",
  },
  {
    n: "02",
    title: "One price, agreed first",
    body: "We confirm scope and price before we start, and build your property checklist.",
  },
  {
    n: "03",
    title: "The turnover",
    body: "Your checklist, room by room, between check-out and check-in.",
  },
  {
    n: "04",
    title: "Photo report, then pay",
    body: "After our quality check you get the photos, then one payment link.",
  },
] as const;

const covers = [
  "Kitchen and bathrooms reset",
  "Beds made and trash removed",
  "Your property's own checklist, followed every visit",
  "Photos of the finished rooms",
  "Anything we notice during the clean, noted in your report",
] as const;

const alsoAvailable = [
  { title: "5+ bedroom homes", body: "Custom quote" },
  { title: "Deep and seasonal cleans", body: "Appliances, baseboards, floors" },
  { title: "Post-construction cleans", body: "After a renovation or project" },
  { title: "Guest welcome setup", body: "Restocking and arrival prep" },
] as const;

const gallery = [
  {
    caption: "Fern Hill · Perkinsville",
    image: PERKINSVILLE_CARD_IMAGES[0],
  },
  {
    caption: "Ludlow · Okemo Valley",
    image: LUDLOW_CARD_IMAGES[0],
  },
  {
    caption: "Middlebury · Addison County",
    image: MIDDLEBURY_CARD_IMAGES[0],
  },
] as const;

const faqs = [
  {
    q: "Which areas do you cover?",
    a: "The Okemo Valley (including Ludlow and Perkinsville) and the Middlebury / Addison County area. Outside those? Ask us.",
    open: true,
  },
  {
    q: "How is pricing set?",
    a: "We quote each property after reviewing its size, scope, schedule and condition. You get one price before the first clean.",
  },
  {
    q: "Who provides linens?",
    a: "Most hosts store linens on the property. Ask us about our linen service.",
  },
  {
    q: "How do I pay?",
    a: "After your photo report, you get one payment request. Zelle is our preferred way to pay. Card (by secure link) and PayPal are also accepted.",
  },
  {
    q: "What if something is missed?",
    a: "Tell us within 24 hours and we'll come back and fix it, free.",
  },
  {
    q: "Can you sync with my Airbnb or VRBO calendar?",
    a: "Calendar sync is coming soon. Until then, we schedule turnovers from your booking list.",
  },
] as const;

export function VermontHostMarketing({ children }: { children: React.ReactNode }) {
  const phoneHref = `tel:+1${VERMONT_SUPPORT.phoneTel}`;
  const emailHref = `mailto:${VERMONT_SUPPORT.email}`;
  const vtReviews = reviewsForMarket("vermont");
  const [featured, ...otherReviews] = vtReviews;

  return (
    <div className="min-h-screen overflow-x-hidden bg-vm-canvas font-body text-base leading-relaxed text-vm-text">
      <TrustStrip />
      <SiteHeader
        quoteHref={QUOTE_ANCHOR}
        activeNav="Vacation rentals"
        className="max-w-none"
      />

      <main>
        {/* Hero */}
        <section className="bg-vm-navy text-vm-white">
          <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-[72px]">
            <div>
              <p className={cn(eyebrowClass, "mb-4 text-vm-cyan")}>
                VERMONT HOSTS · OKEMO VALLEY &amp; MIDDLEBURY
              </p>
              <h1 className="font-heading text-[clamp(2.375rem,5vw,3.625rem)] font-bold leading-[1.04] tracking-[-0.03em]">
                Guest-ready properties,{" "}
                <span className="text-vm-cyan">every turnover.</span>
              </h1>
              <p className="mt-5 max-w-[34rem] text-lg text-vm-nav-text">
                Turnovers that follow your property&apos;s own checklist, with a photo
                report after every clean. You see the work before you pay.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={QUOTE_ANCHOR} className={ctaAccent}>
                  Get my turnover quote
                </a>
                <a href={phoneHref} className={ctaOutline}>
                  Call or text {VERMONT_SUPPORT.phoneDisplay}
                </a>
              </div>
              <p className="mt-4 text-sm text-vm-nav-text">
                No card needed to get a quote.
              </p>
            </div>

            <div className="flex w-full max-w-[440px] flex-col gap-3.5 rounded-[16px] bg-vm-white p-6 text-vm-text shadow-[0_25px_70px_rgba(0,0,0,0.25)] md:justify-self-end">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.04em] text-vm-cyan-dark">
                    What you get · Example
                  </div>
                  <div className="font-heading text-[22px] font-bold tracking-tight text-vm-navy">
                    Turnover report
                  </div>
                </div>
                <span className="whitespace-nowrap rounded-full bg-vm-white px-2.5 py-1 text-xs font-bold text-vm-success shadow-[inset_0_0_0_1px_rgb(var(--vm-border))]">
                  QC approved
                </span>
              </div>
              <dl className="m-0 flex flex-col gap-2 text-sm">
                {reportRows.map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      "flex justify-between gap-4",
                      i < reportRows.length - 1 &&
                        "border-b border-vm-border pb-2"
                    )}
                  >
                    <dt className="text-vm-muted">{row.label}</dt>
                    <dd className="m-0 text-right font-bold">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Reviews */}
        {featured ? (
          <section
            aria-label="Reviews from Vermont hosts"
            className="mx-auto max-w-[1200px] px-4 pb-6 pt-16 sm:px-6"
          >
            <div className="flex flex-wrap gap-4">
              <figure className="m-0 flex flex-[2_1_480px] flex-col gap-4 rounded-[16px] border border-vm-line bg-vm-white p-8">
                <blockquote className="m-0 font-heading text-[clamp(1.1875rem,2.2vw,1.5rem)] font-medium leading-[1.35] tracking-tight text-vm-navy">
                  “{featured.quote}”
                </blockquote>
                <figcaption>
                  <strong>{featured.name}</strong>{" "}
                  <span className="text-sm text-vm-muted">· {featured.context}</span>
                </figcaption>
              </figure>
              {otherReviews.map((review) => (
                <figure
                  key={`${review.name}-${review.quote.slice(0, 24)}`}
                  className="m-0 flex flex-[1_1_280px] flex-col justify-between gap-4 rounded-[16px] border border-vm-line bg-vm-white p-8"
                >
                  <blockquote className="m-0 font-heading text-[clamp(1.1875rem,2.2vw,1.5rem)] font-medium leading-[1.35] tracking-tight text-vm-navy">
                    “{review.quote}”
                  </blockquote>
                  <figcaption>
                    <strong>{review.name}</strong>{" "}
                    <span className="text-sm text-vm-muted">· {review.context}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6"
        >
          <h2 className={cn(h2Class, "mb-2")}>How it works</h2>
          <p className="mb-7 text-[17px]">
            Four steps from first message to guest-ready.
          </p>
          <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-[14px] border border-vm-line bg-vm-white p-6"
              >
                <span className="font-heading text-4xl font-bold text-vm-cyan-dark">
                  {s.n}
                </span>
                <h3 className="mb-1 mt-1.5 font-heading text-[17px] font-bold leading-tight text-vm-navy">
                  {s.title}
                </h3>
                <p className="m-0 text-[15px] text-vm-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* What a turnover covers / Also available */}
        <section className="border-y border-vm-line bg-vm-white">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-2">
            <div>
              <h2 className={cn(h2Class, "mb-4")}>What a turnover covers</h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[17px]">
                {covers.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className={cn(h2Class, "mb-4")}>Also available</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {alsoAvailable.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[12px] bg-vm-canvas px-[18px] py-4"
                  >
                    <strong className="text-vm-navy">{item.title}</strong>
                    <div className="text-sm text-vm-text">{item.body}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[15px]">
                <strong>Pricing:</strong> Okemo Valley turnovers are a flat price by
                bedroom count, in the table below. 5+ bedrooms, Middlebury, and
                outlying towns are a custom quote.
              </p>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section
          aria-labelledby="vt-gallery-heading"
          className="mx-auto max-w-[1200px] px-4 pb-6 pt-16 sm:px-6"
        >
          <h2 id="vt-gallery-heading" className={cn(h2Class, "mb-2")}>
            Vermont properties we look after
          </h2>
          <p className="mb-6 text-[17px]">
            Okemo Valley, Ludlow, Perkinsville, Middlebury and Addison County. Photos
            shared with each owner&apos;s approval.
          </p>
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
            {gallery.map((item) => (
              <li
                key={item.caption}
                className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-vm-border"
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(max-width: 639px) calc(100vw - 2rem), 384px"
                  className="object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-3.5 left-3.5 rounded-lg bg-vm-white px-2.5 py-1 text-[13px] font-semibold text-vm-navy">
                  {item.caption}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
          <VermontTurnoverPrices bookHref={QUOTE_ANCHOR} />
        </section>

        {/* Quote: intro + contact beside the two-step form */}
        <section
          id="get-quote"
          className="mx-auto max-w-[1200px] scroll-mt-24 px-4 py-14 sm:px-6"
        >
          <div className="grid items-start gap-8 md:grid-cols-2">
            <div>
              <p className={cn(eyebrowClass, "mb-3 text-vm-cyan-dark")}>
                GET YOUR QUOTE
              </p>
              <h2 className={cn(h2Class, "mb-3")}>Two minutes now. Details later.</h2>
              <p className="mb-5 text-[17px]">
                Start with the basics and we&apos;ll come back with a quote. Access,
                linens and scheduling details are step two.
              </p>
              <div className="flex flex-col">
                <a href={phoneHref} className={contactLink}>
                  Call or text {VERMONT_SUPPORT.phoneDisplay}
                </a>
                <a href={emailHref} className={contactLink}>
                  {VERMONT_SUPPORT.email}
                </a>
                {VERMONT_SUPPORT.whatsappUrl ? (
                  <a
                    href={VERMONT_SUPPORT.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={contactLink}
                  >
                    Message us on WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
            <div>{children}</div>
          </div>
        </section>

        {/* Host FAQ */}
        <section
          aria-labelledby="vt-faq-heading"
          className="mx-auto max-w-[860px] px-4 pb-[72px] pt-6 sm:px-6"
        >
          <h2 id="vt-faq-heading" className={cn(h2Class, "mb-5")}>
            Host questions
          </h2>
          <div className="flex flex-col gap-2.5">
            {faqs.map((item) => (
              <details
                key={item.q}
                open={"open" in item ? item.open : undefined}
                className="rounded-[12px] border border-vm-line bg-vm-white"
              >
                <summary
                  className={cn(
                    "min-h-touch cursor-pointer rounded-[12px] px-5 py-3.5 font-bold text-vm-navy",
                    vmFocusRing
                  )}
                >
                  {item.q}
                </summary>
                <p className="m-0 px-5 pb-[18px]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
