/**
 * Investor Materials List
 * 
 * Lists available materials for investors
 * Clear, institutional presentation
 */

export default function InvestorMaterialsList() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900">
          Available Materials
        </h3>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-600">
          <li>Investor Overview (PDF)</li>
          <li>Compliance & Risk Readiness Summary (PDF)</li>
          <li>Partner Pilot Proposal (PDF)</li>
          <li>Governance & Architecture Overview (PDF)</li>
        </ul>
      </div>

      <p className="max-w-3xl text-sm text-gray-500">
        Materials are provided for evaluation purposes only and may contain
        non-public information.
      </p>
    </div>
  );
}


