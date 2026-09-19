/**
 * Admin Owner Profitability — P0 authoritative read model.
 *
 * Displays Invoice / InvoicePayment / JobPayout truth only.
 * Does not estimate fees, supplies, overhead, or profit.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAdminShell } from '@/components/admin/shell/AdminShell';

type ProfitabilityResponse = {
  success: boolean;
  error?: string;
  profitability?: {
    scope: {
      mode: 'branch' | 'global';
      branchId: string | null;
      branchName: string | null;
    };
    primary: {
      invoicedRevenue: number;
      draftInvoicedTotal: number;
      collectedRevenue: number;
      outstandingAr: number;
      cleanerPayable: number;
      cleanerPaid: number;
      platformGrossShare: number;
    };
    secondary: {
      processingCost: null;
      processingCostLabel: string;
      directJobCosts: null;
      directJobCostsLabel: string;
      contributionProfit: null;
      contributionProfitLabel: string;
      contributionMargin: null;
      contributionMarginLabel: string;
      costsComplete: false;
    };
    disclaimer: string;
    counts: {
      issuedInvoiceCount: number;
      draftInvoiceCount: number;
      paymentCount: number;
      payablePayoutCount: number;
      paidPayoutCount: number;
    };
  };
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-vm-border bg-white p-4 shadow-sm">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-vm-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-vm-navy">{value}</p>
      {hint ? (
        <p className="mt-1 font-body text-xs text-vm-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export default function AdminProfitabilityPage() {
  const { isBranchScoped } = useAdminShell();
  const [data, setData] = useState<ProfitabilityResponse['profitability'] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/finance/owner-profitability', {
        credentials: 'include',
      });
      const json = (await res.json()) as ProfitabilityResponse;
      if (!res.ok || !json.success || !json.profitability) {
        throw new Error(json.error || 'Failed to load profitability');
      }
      setData(json.profitability);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const scopeLabel =
    data?.scope.mode === 'branch'
      ? data.scope.branchName || 'This branch'
      : 'All branches';

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-vm-navy">
          Owner Profitability
        </h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Authoritative cash and obligation metrics · {scopeLabel}
          {isBranchScoped ? ' (branch-scoped)' : ''}.
        </p>
      </header>

      <div className="rounded-xl border border-vm-cyan/30 bg-vm-cyan/5 px-4 py-3 font-body text-sm text-vm-navy">
        Invoiced is not the same as collected. Cleaner payable is not the same as
        cleaner paid. Platform gross share is not profit.
      </div>

      {loading ? (
        <div className="flex items-center gap-2 font-body text-sm text-vm-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-vm-navy">
              Cash &amp; obligations
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                label="Invoiced Revenue"
                value={formatUsd(data.primary.invoicedRevenue)}
                hint={`Issued invoices (${data.counts.issuedInvoiceCount}). Drafts excluded.`}
              />
              <KpiCard
                label="Collected Revenue"
                value={formatUsd(data.primary.collectedRevenue)}
                hint={`${data.counts.paymentCount} payment record(s)`}
              />
              <KpiCard
                label="Outstanding A/R"
                value={formatUsd(data.primary.outstandingAr)}
                hint="Open issued invoice balances"
              />
              <KpiCard
                label="Cleaner Payable"
                value={formatUsd(data.primary.cleanerPayable)}
                hint={`${data.counts.payablePayoutCount} unpaid obligation(s)`}
              />
              <KpiCard
                label="Cleaner Paid"
                value={formatUsd(data.primary.cleanerPaid)}
                hint={`${data.counts.paidPayoutCount} paid payout(s)`}
              />
              <KpiCard
                label="Platform Gross Share"
                value={formatUsd(data.primary.platformGrossShare)}
                hint="Not profit — residual after cleaner pay"
              />
            </div>
            {data.primary.draftInvoicedTotal > 0 ? (
              <p className="mt-3 font-body text-sm text-vm-muted">
                Draft invoices (not yet issued):{' '}
                {formatUsd(data.primary.draftInvoicedTotal)} (
                {data.counts.draftInvoiceCount} draft
                {data.counts.draftInvoiceCount === 1 ? '' : 's'}).
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-vm-navy">
              Costs &amp; contribution
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Processing Costs"
                value={data.secondary.processingCostLabel}
              />
              <KpiCard
                label="Direct Job Costs"
                value={data.secondary.directJobCostsLabel}
              />
              <KpiCard
                label="Contribution Profit"
                value={data.secondary.contributionProfitLabel}
                hint="Requires actual processing + direct costs"
              />
              <KpiCard
                label="Contribution Margin"
                value={data.secondary.contributionMarginLabel}
                hint="Unavailable until costs are recorded"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
