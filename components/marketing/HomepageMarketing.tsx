import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { PropertyGalleryPreview } from "@/components/marketing/PropertyGalleryPreview";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";
const outlineButton =
  "inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-white transition hover:border-vm-cyan hover:text-vm-cyan";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
      {children}
    </p>
  );
}

export function HomepageMarketing() {
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
