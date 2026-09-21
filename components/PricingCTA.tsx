import Link from "next/link";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";
const outlineButton =
  "inline-flex items-center justify-center rounded-md border border-vm-border px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:border-vm-cyan hover:text-vm-cyan-dark";

export default function PricingCTA() {
  return (
    <div className="rounded-xl border border-vm-border bg-white p-8 text-center shadow-sm sm:p-10">
      <h2 className="font-heading text-2xl font-bold text-vm-navy sm:text-3xl">
        Ready for a quote?
      </h2>
      <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-vm-muted">
        Tell us about your property or home. We&apos;ll confirm scope, timing, and pricing
        before service begins.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/vermont/host-intake" className={primaryButton}>
          Request a Vermont quote
        </Link>
        <Link href="/book?branch=new-jersey" className={outlineButton}>
          Book New Jersey cleaning
        </Link>
      </div>
      <p className="mt-6 font-body text-sm text-vm-muted">
        Call or text{" "}
        <a href="tel:+18027335348" className="font-semibold text-vm-navy hover:text-vm-cyan-dark">
          (802) 733-5348
        </a>
        {" · "}
        <a
          href="mailto:hello@velocitymaid.com"
          className="font-semibold text-vm-navy hover:text-vm-cyan-dark"
        >
          hello@velocitymaid.com
        </a>
      </p>
    </div>
  );
}
