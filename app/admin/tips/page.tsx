'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type TipRow = {
  id: string;
  amountDollars: number;
  entitlementDollars: number;
  platformShareCents: number;
  status: string;
  canonicalStatus: string;
  paymentMethod: string | null;
  internalReference: string | null;
  stripePaymentIntentId: string | null;
  jobReference: string | null;
  propertyName: string | null;
  beneficiaryName: string | null;
  beneficiaryEmail: string | null;
  receivedAt: string | null;
  paidOutAt: string | null;
  paidOutMethod: string | null;
  disputeStatus: string;
  refundedAt: string | null;
  needsReconcile: boolean;
  reconcileReasonLabel: string;
  flags: {
    payable: boolean;
    needsReconcile: boolean;
    possibleStripeDbMismatch: boolean;
    refundAfterPaidOut: boolean;
    disputeAfterPaidOut: boolean;
    disputeOpen: boolean;
    refunded: boolean;
    paidOut: boolean;
  };
};

type Summary = {
  payable: number;
  payableCents: number;
  needsReconcile: number;
  paidOut: number;
  pending: number;
  disputeOpen: number;
  refunded: number;
  possibleStripeDbMismatch: number;
};

export default function AdminTipsPayablesPage() {
  const [tips, setTips] = useState<TipRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'payable' | 'reconcile' | 'all'>('payable');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = view === 'all' ? '' : `?view=${view}`;
    fetch(`/api/admin/tips${qs}`, { credentials: 'include' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.error || 'Failed');
        setTips(data.tips);
        setSummary(data.summary);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [view]);

  useEffect(() => {
    load();
  }, [load]);

  async function markPaidOut(tipId: string) {
    const method = window.prompt(
      'External payment method used (e.g. ZELLE, VENMO, CHECK)?\nThis records settlement only — it does not transfer funds.',
      'ZELLE'
    );
    if (!method || !method.trim()) return;
    const reference = window.prompt('Optional payout reference / memo:', '') || '';
    setBusyId(tipId);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/tips/${tipId}/mark-paid-out`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidOutMethod: method.trim(),
          payoutReference: reference.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to mark paid out');
      }
      setMessage(
        data.alreadyPaidOut
          ? 'Already marked PAID_OUT (idempotent).'
          : 'Recorded as PAID_OUT. API did not transfer funds.'
      );
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-vm-navy">
            Tip payables
          </h1>
          <p className="mt-1 font-body text-sm text-vm-muted">
            Guest tip face value = cleaner entitlement. Record external
            settlement here after you pay the cleaner — this page never moves
            money.
          </p>
        </div>
        <div className="flex gap-2">
          {(
            [
              ['payable', 'Payable'],
              ['reconcile', 'Needs recon'],
              ['all', 'All'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded-full px-3 py-1.5 font-body text-xs font-semibold ${
                view === key
                  ? 'bg-vm-navy text-white'
                  : 'border border-vm-border text-vm-muted hover:bg-vm-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {summary ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Payable now"
            value={`$${(summary.payableCents / 100).toFixed(2)}`}
            sub={`${summary.payable} tips`}
          />
          <SummaryCard
            label="Needs recon"
            value={String(summary.needsReconcile)}
            sub={
              summary.possibleStripeDbMismatch
                ? `${summary.possibleStripeDbMismatch} Stripe mismatch`
                : ' '
            }
          />
          <SummaryCard label="Paid out" value={String(summary.paidOut)} />
          <SummaryCard
            label="Disputes open"
            value={String(summary.disputeOpen)}
            sub={`${summary.refunded} refunded`}
          />
        </div>
      ) : null}

      {message ? (
        <p className="mb-4 rounded-lg border border-vm-border bg-vm-surface px-3 py-2 font-body text-sm text-vm-navy">
          {message}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-vm-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <p className="text-vm-danger font-body text-sm">{error}</p>
      ) : tips.length === 0 ? (
        <p className="font-body text-sm text-vm-muted">No tips in this view.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-vm-border">
          <table className="min-w-full text-left font-body text-sm">
            <thead className="bg-vm-surface text-vm-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold">Cleaner</th>
                <th className="px-3 py-2 font-semibold">Property</th>
                <th className="px-3 py-2 font-semibold">Job</th>
                <th className="px-3 py-2 font-semibold">Stripe</th>
                <th className="px-3 py-2 font-semibold">State</th>
                <th className="px-3 py-2 font-semibold">Received</th>
                <th className="px-3 py-2 font-semibold">Paid out</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {tips.map((t) => (
                <tr key={t.id} className="border-t border-vm-border">
                  <td className="px-3 py-2 font-semibold text-vm-navy">
                    ${t.entitlementDollars.toFixed(2)}
                    <div className="text-xs font-normal text-vm-muted">
                      VM share $0
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {t.beneficiaryName || '—'}
                    {t.beneficiaryEmail ? (
                      <div className="text-xs text-vm-muted">
                        {t.beneficiaryEmail}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{t.propertyName || '—'}</td>
                  <td className="px-3 py-2">{t.jobReference || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {t.stripePaymentIntentId
                      ? `${t.stripePaymentIntentId.slice(0, 18)}…`
                      : t.internalReference || '—'}
                  </td>
                  <td className="px-3 py-2">
                    <StateBadges tip={t} />
                  </td>
                  <td className="px-3 py-2 text-xs text-vm-muted">
                    {t.receivedAt
                      ? new Date(t.receivedAt).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-vm-muted">
                    {t.paidOutAt
                      ? new Date(t.paidOutAt).toLocaleString()
                      : '—'}
                    {t.paidOutMethod ? (
                      <div>{t.paidOutMethod}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {t.flags.payable ? (
                      <button
                        type="button"
                        disabled={busyId === t.id}
                        onClick={() => markPaidOut(t.id)}
                        className="rounded-lg bg-vm-navy px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {busyId === t.id ? '…' : 'Mark paid out'}
                      </button>
                    ) : (
                      <span className="text-xs text-vm-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-vm-border bg-white px-4 py-3">
      <div className="font-body text-xs text-vm-muted">{label}</div>
      <div className="mt-1 font-heading text-xl font-bold text-vm-navy">
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 font-body text-xs text-vm-muted">{sub}</div>
      ) : null}
    </div>
  );
}

function StateBadges({ tip }: { tip: TipRow }) {
  const badges: Array<{ label: string; className: string }> = [];
  if (tip.flags.payable) {
    badges.push({
      label: 'PAYABLE',
      className: 'bg-vm-success/15 text-vm-success',
    });
  }
  badges.push({
    label: tip.canonicalStatus,
    className: 'bg-vm-navy/10 text-vm-navy',
  });
  if (tip.flags.disputeOpen) {
    badges.push({
      label: 'DISPUTE OPEN',
      className: 'bg-vm-danger/15 text-vm-danger',
    });
  }
  if (tip.flags.refunded) {
    badges.push({
      label: 'REFUNDED',
      className: 'bg-vm-danger/15 text-vm-danger',
    });
  }
  if (tip.flags.needsReconcile || tip.flags.possibleStripeDbMismatch) {
    badges.push({
      label: 'NEEDS RECON',
      className: 'bg-amber-100 text-amber-900',
    });
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {badges.map((b) => (
          <span
            key={b.label}
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${b.className}`}
          >
            {b.label}
          </span>
        ))}
      </div>
      {(tip.flags.needsReconcile || tip.flags.possibleStripeDbMismatch) && (
        <div className="text-[10px] text-amber-900 max-w-[14rem]">
          {tip.reconcileReasonLabel}
        </div>
      )}
    </div>
  );
}
