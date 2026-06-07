export default function PricingTiers() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-xl border border-brand-forest/10 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-serif font-semibold text-brand-forest">
          Compliance Infrastructure
        </h3>

        <p className="mt-2 text-3xl font-serif font-bold text-brand-forest">
          $15–$25
          <span className="ml-1 text-base font-sans font-normal text-brand-slate/70">
            / active contractor / month
          </span>
        </p>

        <p className="mt-4 text-brand-slate/70 font-sans">
          Core compliance, readiness, and governance infrastructure.
        </p>

        <ul className="mt-6 list-disc space-y-2 pl-5 text-brand-slate/70 font-sans text-sm">
          <li>Secure W-9 collection & verification</li>
          <li>Readiness scoring & dashboards</li>
          <li>Audit-ready records and logs</li>
          <li>Admin oversight tools</li>
          <li>Board & investor reporting artifacts</li>
        </ul>
      </div>

      <div className="rounded-xl border border-brand-forest/10 bg-brand-ivory/60 p-8 shadow-sm">
        <h3 className="text-lg font-serif font-semibold text-brand-forest">
          Optional Add-Ons (Later)
        </h3>

        <p className="mt-4 text-brand-slate/70 font-sans">
          Payment rails and advanced automation are introduced only when
          governance is ready.
        </p>

        <ul className="mt-6 list-disc space-y-2 pl-5 text-brand-slate/70 font-sans text-sm">
          <li>Stripe Connect payout eligibility</li>
          <li>Optional transaction-based pricing</li>
          <li>Expanded governance reporting</li>
        </ul>

        <p className="mt-4 text-sm text-brand-slate/60 font-sans">
          These features are optional and never required to use the core system.
        </p>
      </div>
    </div>
  );
}
