export default function PricingCTA() {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-8">
      <h3 className="text-lg font-medium text-gray-900">
        Let's Discuss Fit
      </h3>

      <p className="mt-3 max-w-2xl text-gray-600">
        VelocityMaid pricing is designed to be fair, predictable, and aligned
        with real operational needs. We're happy to discuss pilots, volume
        considerations, and rollout timing.
      </p>

      <div className="mt-6">
        <a
          href="/contact"
          className="inline-flex items-center rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          Request a conversation
        </a>
      </div>
    </div>
  );
}


