/**
 * Payout Debug Panel Component
 * 
 * Displays detailed reasons why jobs were skipped during payout generation.
 * Provides instant clarity for operations team.
 */

import { AlertCircle } from "lucide-react";
import { PayoutSkipReason, SkippedJobDebug } from "@/lib/payoutDebug";

interface PayoutDebugPanelProps {
  debug: SkippedJobDebug[];
}

export function PayoutDebugPanel({ debug }: PayoutDebugPanelProps) {
  if (!debug || debug.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-yellow-700" />
        <h3 className="font-semibold text-yellow-800">
          Skipped Jobs — Debug Details
        </h3>
        <span className="ml-auto text-sm text-yellow-700 font-medium">
          {debug.length} job{debug.length !== 1 ? "s" : ""} skipped
        </span>
      </div>

      <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
        {debug.map((item) => (
          <div
            key={item.jobId}
            className="rounded-lg bg-white p-3 shadow-sm border border-yellow-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Job ID: <span className="font-mono">{item.jobId}</span>
                </div>
                {item.jobDetails && (
                  <div className="text-xs text-gray-500 mb-2 space-y-0.5">
                    {item.jobDetails.status && (
                      <div>Status: {item.jobDetails.status}</div>
                    )}
                    {item.jobDetails.assignedCleanerId && (
                      <div>Cleaner: {item.jobDetails.assignedCleanerId}</div>
                    )}
                    {item.jobDetails.completedAt && (
                      <div>
                        Completed: {new Date(item.jobDetails.completedAt).toLocaleString()}
                      </div>
                    )}
                    {item.jobDetails.totalPrice !== null && item.jobDetails.totalPrice !== undefined && (
                      <div>Amount: ${item.jobDetails.totalPrice.toFixed(2)}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Skip Reasons:
              </div>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                {item.reasons.map((reason, idx) => (
                  <li key={idx} className="text-red-700">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-yellow-700">
        <p>
          These jobs were skipped during payout generation. Review the reasons above to understand why each job did not become a payout.
        </p>
      </div>
    </div>
  );
}













