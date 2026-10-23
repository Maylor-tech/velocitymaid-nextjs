import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import {
  VERMONT_OPERATIONS_SUPPORT_LINE1,
  VERMONT_OPERATIONS_SUPPORT_LINE2,
} from "@/lib/company/businessAddress";
import { homeWatchIntakeHref } from "@/lib/hostIntake/homeWatchIntake";
import { VERMONT_HOST_INTAKE_PATH } from "@/lib/marketing/publicCtas";

function RequestHomeWatchActions({ onNavy }: { onNavy: boolean }) {
  const note = onNavy ? "text-white/75" : "text-vm-text";
  const link = onNavy
    ? "font-semibold text-vm-cyan underline-offset-2 hover:underline"
    : "font-semibold text-vm-navy underline-offset-2 hover:underline";
  return (
    <div className="mt-8">
      <Link
        href={homeWatchIntakeHref(VERMONT_HOST_INTAKE_PATH)}
        className="inline-flex items-center justify-center rounded-lg bg-vm-cyan px-5 py-3 font-heading text-sm font-semibold text-vm-navy transition hover:bg-vm-cyan-dark"
      >
        Request Home Watch →
      </Link>
      <p className={`mt-4 font-body text-sm leading-relaxed ${note}`}>
        Prefer to talk? Call or text{" "}
        <a href="tel:+18027335348" className={link}>
          (802) 733-5348
        </a>
        {" · "}
        <a
          href="https://wa.me/18027335348"
          target="_blank"
          rel="noreferrer"
          className={link}
        >
          WhatsApp
        </a>
      </p>
    </div>
  );
}

const CHECKS = [
  "Heat and thermostat, so pipes stay above freezing",
  "Faucets run and toilets flushed to prevent freezing and dry traps",
  "Signs of leaks, moisture, mold or odors",
  "Doors, windows and locks",
  "Roof line, gutters and ice dams from the ground",
  "Storm damage, downed branches and animal activity",
  "Mail and packages, if you'd like",
] as const;

export function VermontHomeWatch() {
  return (
    <div className="min-h-screen bg-white font-body">
      <SiteHeader />
      <main>
        <section className="bg-vm-navy">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-vm-cyan">
              VERMONT SECOND HOMES
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white sm:text-5xl">
              Your Vermont home, checked while you&apos;re away.
            </h1>
            <p className="mt-5 font-body text-base leading-relaxed text-white/75 sm:text-lg">
              Empty homes don&apos;t stay problem-free in a Vermont winter. We visit on a
              set schedule, walk through a property-specific checklist, and send you a
              photo report after every visit, so you know your home is fine before you
              need to worry.
            </p>
            <RequestHomeWatchActions onNavy />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold text-vm-navy">What we check</h2>
          <ul className="mt-6 space-y-3">
            {CHECKS.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-vm-border bg-vm-surface px-4 py-3 font-body text-sm leading-relaxed text-vm-text"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-vm-surface">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="font-body text-base leading-relaxed text-vm-text">
              After every visit: a dated photo report in your inbox. If something&apos;s
              wrong, we call you the same day and help arrange the fix.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-heading text-2xl font-bold text-vm-navy">Plans</h2>
          <p className="mt-4 font-body text-base leading-relaxed text-vm-text">
            Seasonal Check, every other week, $150/month · Weekly Watch, $275/month ·
            Storm or emergency check, $75 per visit
          </p>
          <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
            One price confirmed before we start. No long contracts.
          </p>
        </section>

        <section className="bg-vm-navy">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="font-heading text-2xl font-bold text-white">
              Pairs with cleaning
            </h2>
            <p className="mt-4 font-body text-base leading-relaxed text-white/75">
              We can also get the house guest-ready before you or your renters arrive.
            </p>
            <RequestHomeWatchActions onNavy />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <p className="font-body text-xs leading-relaxed text-vm-muted">
            Scheduled visits only. Home Watch is not 24/7 monitoring. We do not perform
            repairs, and this is not an insurance or certification service.
          </p>
          <div className="mt-6 border-t border-vm-border pt-6 font-body text-xs leading-relaxed text-vm-muted">
            <p>
              {VERMONT_OPERATIONS_SUPPORT_LINE1} {VERMONT_OPERATIONS_SUPPORT_LINE2}
            </p>
            <p className="mt-1">
              Serving Okemo Valley and Middlebury / Addison County.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
