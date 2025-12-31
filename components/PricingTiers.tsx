export default function PricingTiers() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-md border border-gray-200 p-8">
        <h3 className="text-lg font-medium text-gray-900">
          Compliance Infrastructure
        </h3>

        <p className="mt-2 text-3xl font-semibold text-gray-900">
          $15–$25
          <span className="ml-1 text-base font-normal text-gray-600">
            / active contractor / month
          </span>
        </p>

        <p className="mt-4 text-gray-600">
          Core compliance, readiness, and governance infrastructure.
        </p>

        <ul className="mt-6 list-disc space-y-2 pl-5 text-gray-600">
          <li>Secure W-9 collection & verification</li>
          <li>Readiness scoring & dashboards</li>
          <li>Audit-ready records and logs</li>
          <li>Admin oversight tools</li>
          <li>Board & investor reporting artifacts</li>
        </ul>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-8">
        <h3 className="text-lg font-medium text-gray-900">
          Optional Add-Ons (Later)
        </h3>

        <p className="mt-4 text-gray-600">
          Payment rails and advanced automation are introduced only when
          governance is ready.
        </p>

        <ul className="mt-6 list-disc space-y-2 pl-5 text-gray-600">
          <li>Stripe Connect payout eligibility</li>
          <li>Optional transaction-based pricing</li>
          <li>Expanded governance reporting</li>
        </ul>

        <p className="mt-4 text-sm text-gray-500">
          These features are optional and never required to use the core system.
        </p>
      </div>
    </div>
  );
}


