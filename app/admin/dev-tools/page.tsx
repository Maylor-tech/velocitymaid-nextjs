"use client";

import { useState } from "react";
import AdminLayout from "../components/AdminLayout";

type LogEntry = Record<string, unknown>;

interface ActionCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => Promise<void>;
  loading: boolean;
  logs: LogEntry | null;
  variant?: "danger" | "primary";
}

function ActionCard({
  title,
  description,
  actionLabel,
  onAction,
  loading,
  logs,
  variant = "primary",
}: ActionCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <button
          onClick={onAction}
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors ${
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-primary-600 hover:bg-primary-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? "Running..." : actionLabel}
        </button>
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Logs</p>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-xs text-gray-800 overflow-x-auto">
          <pre className="whitespace-pre-wrap">
{logs ? JSON.stringify(logs, null, 2) : "No logs yet."}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function DevToolsPage() {
  const isDev =
    process.env.NEXT_PUBLIC_APP_ENV === "development" ||
    process.env.NODE_ENV === "development";

  const [seedLogs, setSeedLogs] = useState<LogEntry | null>(null);
  const [resetLogs, setResetLogs] = useState<LogEntry | null>(null);
  const [recalcLogs, setRecalcLogs] = useState<LogEntry | null>(null);
  const [syncLogs, setSyncLogs] = useState<LogEntry | null>(null);
  const [cacheLogs, setCacheLogs] = useState<LogEntry | null>(null);
  const [errorLogs, setErrorLogs] = useState<LogEntry | null>(null);

  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingRecalc, setLoadingRecalc] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingCache, setLoadingCache] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAction = async (
    url: string,
    setLogs: (log: LogEntry) => void,
    setLoading: (val: boolean) => void,
    options?: RequestInit
  ) => {
    setLoading(true);
    try {
      const res = await fetch(url, { method: "POST", ...options });
      const data = await res.json();
      setLogs(data);
      if (!data.success) {
        alert(data.error || "Action failed");
      } else {
        alert("Action completed");
      }
    } catch (err: any) {
      setLogs({ error: err.message || "Unknown error" });
      alert("Action failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isDev) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-2">
            <p className="text-2xl font-semibold text-gray-900">
              Developer Tools Disabled — Production Mode
            </p>
            <p className="text-gray-600">
              This page is only available in development.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Developer Tools</h1>
          <p className="text-gray-600 mt-1">
            System maintenance, database tools, and debugging utilities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActionCard
            title="Seed Demo Data"
            description="Seed the database with demo cleaners, customers, jobs, and logs."
            actionLabel="Run Seeder"
            onAction={() =>
              handleAction("/api/dev/seed", setSeedLogs, setLoadingSeed)
            }
            loading={loadingSeed}
            logs={seedLogs}
          />

          <ActionCard
            title="Reset Database"
            description="Clear all business data. Use with caution."
            actionLabel="Reset DB"
            variant="danger"
            onAction={async () => {
              setShowResetConfirm(true);
            }}
            loading={loadingReset}
            logs={resetLogs}
          />

          <ActionCard
            title="Recalculate Cleaner Levels"
            description="Recompute cleaner levels based on performance metrics."
            actionLabel="Recalculate"
            onAction={() =>
              handleAction(
                "/api/dev/recalculate-cleaners",
                setRecalcLogs,
                setLoadingRecalc
              )
            }
            loading={loadingRecalc}
            logs={recalcLogs}
          />

          <ActionCard
            title="Sync Job Metrics"
            description="Recalculate job quality scores and aggregate metrics."
            actionLabel="Sync Jobs"
            onAction={() =>
              handleAction(
                "/api/dev/sync-job-metrics",
                setSyncLogs,
                setLoadingSync
              )
            }
            loading={loadingSync}
            logs={syncLogs}
          />

          <ActionCard
            title="Clear Cache"
            description="Clear cached data (simulated)."
            actionLabel="Clear Cache"
            onAction={() =>
              handleAction(
                "/api/dev/clear-cache",
                setCacheLogs,
                setLoadingCache
              )
            }
            loading={loadingCache}
            logs={cacheLogs}
          />

          <ActionCard
            title="Simulate Error"
            description="Trigger a test error to verify error handling."
            actionLabel="Run Error Test"
            variant="danger"
            onAction={() =>
              handleAction(
                "/api/dev/error-test",
                setErrorLogs,
                setLoadingError
              )
            }
            loading={loadingError}
            logs={errorLogs}
          />
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Database Reset
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              This will delete all business data. Are you sure you want to
              continue?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowResetConfirm(false);
                  await handleAction(
                    "/api/dev/reset",
                    setResetLogs,
                    setLoadingReset
                  );
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Yes, reset
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
















