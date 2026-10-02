'use client';

/**
 * Admin Job Team editor — persists via PUT /api/admin/jobs/[jobId]/team only.
 * Primary = cleanerIds[0] (portal/payout). Assistants = participation rows only.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Users, X } from 'lucide-react';
import {
  draftFromOrderedIds,
  validateAndBuildCleanerIds,
  type JobTeamDraft,
} from '@/lib/cleaners/jobTeamAssignment';
import {
  TEAM_PAYMENT_METHODS,
  formatPaidSummary,
  formatUsdFromCents,
  parseUsdToCents,
  type TeamPaymentMethod,
} from '@/lib/cleaners/jobTeamCompensation';

type CleanerOption = {
  id: string;
  name: string | null;
  email: string;
};

type TeamMember = {
  id: string;
  name: string | null;
  publicDisplayName?: string | null;
};

type TeamCompensation = {
  id: string;
  cleanerId: string;
  amountCents: number;
  status: 'OWED' | 'PAID';
  paymentMethod: TeamPaymentMethod | null;
  paidAt: string | null;
  paymentRef: string | null;
  note: string | null;
};

type Props = {
  jobId: string;
  cleaners: CleanerOption[];
  disabled?: boolean;
  onSaved?: (payload: {
    team: TeamMember[];
    primaryCleanerId: string | null;
  }) => void;
  onToast?: (message: string, type: 'success' | 'error') => void;
};

function labelFor(c: CleanerOption): string {
  return c.name?.trim() || c.email;
}

export default function JobTeamSection({
  jobId,
  cleaners,
  disabled = false,
  onSaved,
  onToast,
}: Props) {
  const [draft, setDraft] = useState<JobTeamDraft>({
    primaryCleanerId: null,
    assistantCleanerIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [compensations, setCompensations] = useState<TeamCompensation[]>([]);
  const [editCleanerId, setEditCleanerId] = useState<string | null>(null);
  const [editDollars, setEditDollars] = useState('100.00');
  const [payCleanerId, setPayCleanerId] = useState<string | null>(null);
  const [payDollars, setPayDollars] = useState('100.00');
  const [payMethod, setPayMethod] = useState<TeamPaymentMethod>('ZELLE');
  const [payDate, setPayDate] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payConfirm, setPayConfirm] = useState(false);
  const [compSaving, setCompSaving] = useState(false);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/team`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load job team');
      }
      const ids = (data.team as TeamMember[]).map((m) => m.id);
      setDraft(draftFromOrderedIds(ids));
      setCompensations((data.compensations as TeamCompensation[]) || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load job team');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const assistantOptions = useMemo(() => {
    return cleaners.filter(
      (c) => c.id !== draft.primaryCleanerId && !draft.assistantCleanerIds.includes(c.id)
    );
  }, [cleaners, draft.primaryCleanerId, draft.assistantCleanerIds]);

  const primaryOptions = useMemo(() => {
    // Primary select shows all cleaners; choosing someone already assistant
    // will move them to primary and drop from assistants on change.
    return cleaners;
  }, [cleaners]);

  const setPrimary = (id: string) => {
    const nextPrimary = id || null;
    setDraft((prev) => ({
      primaryCleanerId: nextPrimary,
      assistantCleanerIds: nextPrimary
        ? prev.assistantCleanerIds.filter((a) => a !== nextPrimary)
        : [],
    }));
  };

  const addAssistant = (id: string) => {
    if (!id) return;
    setDraft((prev) => {
      if (!prev.primaryCleanerId) return prev;
      if (id === prev.primaryCleanerId) return prev;
      if (prev.assistantCleanerIds.includes(id)) return prev;
      return {
        ...prev,
        assistantCleanerIds: [...prev.assistantCleanerIds, id],
      };
    });
  };

  const removeAssistant = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      assistantCleanerIds: prev.assistantCleanerIds.filter((a) => a !== id),
    }));
  };

  const clearTeam = () => {
    setDraft({ primaryCleanerId: null, assistantCleanerIds: [] });
  };

  const compensationByCleaner = useMemo(() => {
    const map = new Map<string, TeamCompensation>();
    for (const row of compensations) map.set(row.cleanerId, row);
    return map;
  }, [compensations]);

  const historicalPay = useMemo(() => {
    return compensations.filter(
      (row) =>
        row.cleanerId !== draft.primaryCleanerId &&
        !draft.assistantCleanerIds.includes(row.cleanerId)
    );
  }, [compensations, draft.assistantCleanerIds, draft.primaryCleanerId]);

  const openEdit = (cleanerId: string) => {
    const existing = compensationByCleaner.get(cleanerId);
    setEditCleanerId(cleanerId);
    setPayCleanerId(null);
    setEditDollars(
      existing ? (existing.amountCents / 100).toFixed(2) : '100.00'
    );
  };

  const openPay = (cleanerId: string) => {
    const existing = compensationByCleaner.get(cleanerId);
    setPayCleanerId(cleanerId);
    setEditCleanerId(null);
    setPayDollars(existing ? (existing.amountCents / 100).toFixed(2) : '100.00');
    setPayMethod('ZELLE');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayRef('');
    setPayNote(existing?.note ?? '');
    setPayConfirm(false);
  };

  const saveCompensation = async (cleanerId: string) => {
    const cents = parseUsdToCents(editDollars);
    if (cents == null || cents <= 0) {
      onToast?.('Enter a valid dollar amount (e.g. 100.00).', 'error');
      return;
    }
    setCompSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/team-compensation`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId, amountCents: cents }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save compensation');
      }
      const saved = data.compensation as TeamCompensation;
      setCompensations((prev) => {
        const rest = prev.filter((c) => c.cleanerId !== cleanerId);
        return [...rest, saved];
      });
      setEditCleanerId(null);
      onToast?.('Assistant compensation saved as Owed.', 'success');
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Failed to save compensation', 'error');
    } finally {
      setCompSaving(false);
    }
  };

  const recordPayment = async (cleanerId: string) => {
    const cents = parseUsdToCents(payDollars);
    if (cents == null || cents <= 0) {
      onToast?.('Enter a valid amount paid.', 'error');
      return;
    }
    if (!payConfirm) {
      onToast?.('Confirm that this payment was already sent outside VelocityMaid.', 'error');
      return;
    }
    setCompSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/team-compensation/pay`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerId,
          amountCents: cents,
          paymentMethod: payMethod,
          paidAt: payDate ? `${payDate}T12:00:00.000Z` : new Date().toISOString(),
          paymentRef: payRef.trim() || null,
          note: payNote.trim() || null,
          confirm: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }
      const saved = data.compensation as TeamCompensation;
      setCompensations((prev) => {
        const rest = prev.filter((c) => c.cleanerId !== cleanerId);
        return [...rest, saved];
      });
      setPayCleanerId(null);
      onToast?.(data.summary || 'Payment recorded.', 'success');
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Failed to record payment', 'error');
    } finally {
      setCompSaving(false);
    }
  };

  const save = async () => {
    const validated = validateAndBuildCleanerIds(draft);
    if ('error' in validated) {
      onToast?.(validated.error, 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/team`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerIds: validated.cleanerIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save job team');
      }
      const team = (data.team as TeamMember[]) || [];
      setDraft(draftFromOrderedIds(team.map((m) => m.id)));
      if (Array.isArray(data.compensations)) {
        setCompensations(data.compensations as TeamCompensation[]);
      }
      onSaved?.({
        team,
        primaryCleanerId: validated.cleanerIds[0] ?? null,
      });
      onToast?.(
        validated.cleanerIds.length === 0
          ? 'Job team cleared.'
          : 'Job team saved. Primary cleaner owns portal access and payout.',
        'success'
      );
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Failed to save job team', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-2 mb-2">
        <Users className="h-5 w-5 text-vm-navy mt-0.5" />
        <div>
          <h2 className="text-xl font-semibold text-vm-text">Job Team</h2>
          <p className="mt-1 text-sm text-vm-muted">
            Primary cleaner owns the cleaner portal and payout. Additional team members
            are participation records. Assistant pay is a separate VelocityMaid expense
            record — it does not change JobPayout, customer invoices, or send Zelle.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-vm-cyan" />
        </div>
      ) : loadError ? (
        <div className="mt-4">
          <p className="text-sm text-vm-danger">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadTeam()}
            className="mt-2 text-sm font-semibold text-vm-navy underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-vm-text mb-1">
              Primary cleaner
            </label>
            <select
              value={draft.primaryCleanerId ?? ''}
              onChange={(e) => setPrimary(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={saving || disabled}
            >
              <option value="">— None (empty team) —</option>
              {primaryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {labelFor(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-1">
              Team members (assistants)
            </label>
            {draft.assistantCleanerIds.length === 0 ? (
              <p className="text-sm text-vm-muted mb-2">No assisting cleaners yet.</p>
            ) : (
              <ul className="mb-2 space-y-3">
                {draft.assistantCleanerIds.map((id, index) => {
                  const c = cleaners.find((x) => x.id === id);
                  const name = c ? labelFor(c) : id;
                  const comp = compensationByCleaner.get(id);
                  return (
                    <li
                      key={id}
                      className="rounded-lg border border-gray-200 px-3 py-3 pointer-events-auto opacity-100"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-vm-muted">
                            Team member {index + 1}
                          </span>
                          <p className="text-sm font-medium text-vm-text">{name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAssistant(id)}
                          className="rounded-lg border border-gray-200 p-1.5 text-vm-muted hover:text-vm-danger"
                          aria-label={`Remove ${name}`}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm pointer-events-auto">
                        <dt className="text-vm-muted">Compensation</dt>
                        <dd className="font-medium text-vm-text">
                          {comp ? formatUsdFromCents(comp.amountCents) : '—'}
                        </dd>
                        <dt className="text-vm-muted">Status</dt>
                        <dd className="font-medium text-vm-text">
                          {comp?.status === 'PAID'
                            ? 'Paid'
                            : comp?.status === 'OWED'
                              ? 'Owed'
                              : '—'}
                        </dd>
                      </dl>
                      {comp?.status === 'PAID' && (
                        <p className="mt-1 text-sm text-vm-success">
                          {formatPaidSummary({
                            amountCents: comp.amountCents,
                            paymentMethod: comp.paymentMethod,
                            paidAt: comp.paidAt,
                          })}
                        </p>
                      )}
                      {editCleanerId === id && (
                        <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3 pointer-events-auto">
                          <label className="block text-sm font-medium text-vm-text">
                            Compensation (USD)
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editDollars}
                              onChange={(e) => setEditDollars(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving || comp?.status === 'PAID'}
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void saveCompensation(id)}
                              disabled={compSaving || comp?.status === 'PAID'}
                              className="rounded-lg bg-vm-navy px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {compSaving ? 'Saving…' : 'Save as Owed'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditCleanerId(null)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {payCleanerId === id && (
                        <div className="mt-3 space-y-2 rounded-lg bg-amber-50 p-3 pointer-events-auto">
                          <p className="text-xs text-amber-900">
                            Records an already-sent payment. VelocityMaid does not send
                            Zelle or store banking credentials.
                          </p>
                          <label className="block text-sm font-medium text-vm-text">
                            Amount paid
                            <input
                              type="text"
                              inputMode="decimal"
                              value={payDollars}
                              onChange={(e) => setPayDollars(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            />
                          </label>
                          <label className="block text-sm font-medium text-vm-text">
                            Method
                            <select
                              value={payMethod}
                              onChange={(e) =>
                                setPayMethod(e.target.value as TeamPaymentMethod)
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            >
                              {TEAM_PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>
                                  {m === 'ZELLE'
                                    ? 'Zelle'
                                    : m === 'CASH'
                                      ? 'Cash'
                                      : m === 'CHECK'
                                        ? 'Check'
                                        : 'Other'}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm font-medium text-vm-text">
                            Paid date
                            <input
                              type="date"
                              value={payDate}
                              onChange={(e) => setPayDate(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            />
                          </label>
                          <label className="block text-sm font-medium text-vm-text">
                            Reference (optional)
                            <input
                              type="text"
                              value={payRef}
                              onChange={(e) => setPayRef(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            />
                          </label>
                          <label className="block text-sm font-medium text-vm-text">
                            Note (optional)
                            <input
                              type="text"
                              value={payNote}
                              onChange={(e) => setPayNote(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            />
                          </label>
                          <label className="flex items-start gap-2 text-sm text-vm-text">
                            <input
                              type="checkbox"
                              checked={payConfirm}
                              onChange={(e) => setPayConfirm(e.target.checked)}
                              className="mt-1"
                              disabled={compSaving}
                            />
                            <span>
                              I confirm this payment was already sent outside
                              VelocityMaid. Mark status Paid.
                            </span>
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void recordPayment(id)}
                              disabled={compSaving || !payConfirm}
                              className="rounded-lg bg-vm-success-bg px-3 py-1.5 text-sm font-semibold text-vm-success border border-vm-success disabled:opacity-50"
                            >
                              {compSaving ? 'Recording…' : 'Record payment'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayCleanerId(null)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {editCleanerId !== id && payCleanerId !== id && (
                        <div className="mt-2 flex flex-wrap gap-2 pointer-events-auto">
                          {comp?.status !== 'PAID' && (
                            <button
                              type="button"
                              onClick={() => openEdit(id)}
                              className="text-sm font-semibold text-vm-navy underline"
                            >
                              Edit compensation
                            </button>
                          )}
                          {comp && comp.status !== 'PAID' && (
                            <button
                              type="button"
                              onClick={() => openPay(id)}
                              className="text-sm font-semibold text-vm-success underline"
                            >
                              Record payment
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <select
              value=""
              onChange={(e) => {
                addAssistant(e.target.value);
                e.target.value = '';
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              disabled={
                saving ||
                !draft.primaryCleanerId ||
                assistantOptions.length === 0
              }
            >
              <option value="">
                {!draft.primaryCleanerId
                  ? 'Select a primary cleaner first'
                  : assistantOptions.length === 0
                    ? 'No more cleaners available'
                    : 'Add team member…'}
              </option>
              {assistantOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {labelFor(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-dashed border-gray-200 bg-vm-surface/40 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-vm-muted mb-1">
              Current order
            </p>
            {!draft.primaryCleanerId ? (
              <p className="text-sm text-vm-muted">Empty team</p>
            ) : (
              <ol className="list-decimal list-inside text-sm text-vm-text space-y-0.5">
                <li>
                  <span className="font-semibold">Primary cleaner:</span>{' '}
                  {labelFor(
                    cleaners.find((c) => c.id === draft.primaryCleanerId) || {
                      id: draft.primaryCleanerId,
                      name: null,
                      email: draft.primaryCleanerId,
                    }
                  )}
                </li>
                {draft.assistantCleanerIds.map((id) => (
                  <li key={id}>
                    <span className="font-semibold">Team member:</span>{' '}
                    {labelFor(
                      cleaners.find((c) => c.id === id) || {
                        id,
                        name: null,
                        email: id,
                      }
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save job team
            </button>
            <button
              type="button"
              onClick={clearTeam}
              disabled={saving || disabled || (!draft.primaryCleanerId && draft.assistantCleanerIds.length === 0)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-vm-text hover:bg-gray-50 disabled:opacity-50"
            >
              Clear team
            </button>
          </div>

          {historicalPay.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                Historical assistant pay
              </p>
              <p className="mt-1 text-xs text-amber-800">
                These payment records stay even if the cleaner is no longer on the
                current job team.
              </p>
              <ul className="mt-2 space-y-2">
                {historicalPay.map((row) => {
                  const c = cleaners.find((x) => x.id === row.cleanerId);
                  const name = c ? labelFor(c) : row.cleanerId;
                  return (
                    <li key={row.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                      <p className="text-sm font-medium text-vm-text">{name}</p>
                      <p className="text-sm text-vm-muted">
                        Compensation {formatUsdFromCents(row.amountCents)} ·{' '}
                        {row.status === 'PAID' ? 'Paid' : 'Owed'}
                      </p>
                      {row.status === 'PAID' && (
                        <p className="text-sm text-vm-success">
                          {formatPaidSummary({
                            amountCents: row.amountCents,
                            paymentMethod: row.paymentMethod,
                            paidAt: row.paidAt,
                          })}
                        </p>
                      )}
                      {row.status !== 'PAID' && payCleanerId !== row.cleanerId && editCleanerId !== row.cleanerId && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(row.cleanerId)}
                            className="text-sm font-semibold text-vm-navy underline"
                          >
                            Edit compensation
                          </button>
                          <button
                            type="button"
                            onClick={() => openPay(row.cleanerId)}
                            className="text-sm font-semibold text-vm-success underline"
                          >
                            Record payment
                          </button>
                        </div>
                      )}
                      {editCleanerId === row.cleanerId && (
                        <div className="mt-2 space-y-2">
                          <label className="block text-sm font-medium text-vm-text">
                            Compensation (USD)
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editDollars}
                              onChange={(e) => setEditDollars(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void saveCompensation(row.cleanerId)}
                              disabled={compSaving}
                              className="rounded-lg bg-vm-navy px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Save as Owed
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditCleanerId(null)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {payCleanerId === row.cleanerId && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-amber-900">
                            Records an already-sent payment. VelocityMaid does not send
                            Zelle or store banking credentials.
                          </p>
                          <label className="block text-sm font-medium text-vm-text">
                            Amount paid
                            <input
                              type="text"
                              inputMode="decimal"
                              value={payDollars}
                              onChange={(e) => setPayDollars(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            />
                          </label>
                          <label className="block text-sm font-medium text-vm-text">
                            Method
                            <select
                              value={payMethod}
                              onChange={(e) =>
                                setPayMethod(e.target.value as TeamPaymentMethod)
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            >
                              {TEAM_PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>
                                  {m === 'ZELLE'
                                    ? 'Zelle'
                                    : m === 'CASH'
                                      ? 'Cash'
                                      : m === 'CHECK'
                                        ? 'Check'
                                        : 'Other'}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm font-medium text-vm-text">
                            Paid date
                            <input
                              type="date"
                              value={payDate}
                              onChange={(e) => setPayDate(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                              disabled={compSaving}
                            />
                          </label>
                          <label className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={payConfirm}
                              onChange={(e) => setPayConfirm(e.target.checked)}
                            />
                            I confirm this payment was already sent outside
                            VelocityMaid. Mark status Paid.
                          </label>
                          <button
                            type="button"
                            onClick={() => void recordPayment(row.cleanerId)}
                            disabled={compSaving || !payConfirm}
                            className="rounded-lg bg-vm-success-bg px-3 py-1.5 text-sm font-semibold text-vm-success border border-vm-success disabled:opacity-50"
                          >
                            Record payment
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
