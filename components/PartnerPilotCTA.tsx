/**
 * Partner Pilot CTA
 * 
 * Clear, calm call-to-action for pilot program
 * No hype, no pressure, clear next step
 */

export default function PartnerPilotCTA() {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-8">
      <h3 className="text-lg font-medium text-gray-900">
        Start with a Pilot
      </h3>

      <p className="mt-3 max-w-2xl text-gray-600">
        Partners typically begin with a limited compliance pilot—running in
        parallel with existing operations and without changes to payroll or
        payment systems.
      </p>

      <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-600">
        <li>30–60 day pilot period</li>
        <li>Small contractor group (5–15 recommended)</li>
        <li>No long-term commitment</li>
      </ul>

      <div className="mt-6">
        <a
          href="/contact"
          className="inline-flex items-center rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          Discuss a pilot
        </a>
      </div>
    </div>
  );
}


