'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

type WorkerRecord = {
  cleanerId: string;
  email: string;
  phone: string | null;
  displayName: string | null;
  identity: {
    legalFirstName: string | null;
    legalLastName: string | null;
    preferredDisplayName: string | null;
    mailingAddressLine1: string | null;
    mailingCity: string | null;
    mailingState: string | null;
    mailingPostalCode: string | null;
    mailingCountry: string | null;
  };
  workStatus: {
    classificationStatus: string;
    memberStatus: string;
    isActive: boolean;
    startDate: string | null;
    inactiveDate: string | null;
    primaryBranch: { id: string; name: string; country: string | null } | null;
  };
  documentation: {
    w9MetaStatus: string;
    agreements: Array<{
      id: string;
      agreementType: string;
      agreementVersion: string;
      status: string;
      signedAt: string | null;
    }>;
    documents: Array<{
      id: string;
      documentType: string;
      status: string;
    }>;
  };
  paymentPreference: string | null;
  compensationSummary: {
    serviceEarnedCents: number;
    servicePaidCents: number;
    tipsEarnedCents: number;
    tipsPaidCents: number;
    totalPaidCents: number;
    outstandingPayableCents: number;
    jobsCompleted: number;
  };
};

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminWorkerRecordPage() {
  const params = useParams();
  const cleanerId = String(params.cleanerId || '');
  const [record, setRecord] = useState<WorkerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classification, setClassification] = useState('UNRESOLVED');
  const [paymentPreference, setPaymentPreference] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cleaners/${cleanerId}/worker-record`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load');
      setRecord(data.record);
      setClassification(data.record.workStatus.classificationStatus);
      setPaymentPreference(data.record.paymentPreference || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [cleanerId]);

  useEffect(() => {
    if (cleanerId) load();
  }, [cleanerId, load]);

  async function saveClassification() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cleaners/${cleanerId}/worker-record`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patch: {
            classificationStatus: classification,
            paymentPreference: paymentPreference || null,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setRecord(data.record);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-7">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-7">
        <p className="text-vm-muted">{error || 'Worker record not found'}</p>
        <Link href="/admin/cleaners" className="mt-4 inline-flex text-sm text-vm-navy underline">
          Back to cleaners
        </Link>
      </div>
    );
  }

  const id = record.identity;
  const ws = record.workStatus;
  const cs = record.compensationSummary;

  return (
    <div className="p-7 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/cleaners"
          className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-muted hover:text-vm-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Cleaners
        </Link>

        <h1 className="font-heading text-2xl font-bold text-vm-navy">Worker Record</h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          {record.displayName || record.email} · operational metadata (not payroll / tax filing)
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <section className="mt-8">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-vm-muted">
            Identity
          </h2>
          <dl className="mt-3 grid gap-2 font-body text-sm text-vm-navy sm:grid-cols-2">
            <div>
              <dt className="text-vm-muted">Legal name</dt>
              <dd>
                {[id.legalFirstName, id.legalLastName].filter(Boolean).join(' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-vm-muted">Preferred display</dt>
              <dd>{id.preferredDisplayName || '—'}</dd>
            </div>
            <div>
              <dt className="text-vm-muted">Email / phone</dt>
              <dd>
                {record.email}
                {record.phone ? ` · ${record.phone}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-vm-muted">Mailing address</dt>
              <dd>
                {id.mailingAddressLine1
                  ? `${id.mailingAddressLine1}, ${[id.mailingCity, id.mailingState, id.mailingPostalCode]
                      .filter(Boolean)
                      .join(' ')}`
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-vm-muted">
            Work status
          </h2>
          <div className="mt-3 space-y-3 font-body text-sm">
            <p>
              Classification:{' '}
              <span
                className={
                  ws.classificationStatus === 'UNRESOLVED'
                    ? 'font-semibold text-amber-800'
                    : 'font-semibold text-vm-navy'
                }
              >
                {ws.classificationStatus}
              </span>
            </p>
            <p>
              Member: {ws.memberStatus} · Active: {ws.isActive ? 'yes' : 'no'}
            </p>
            <p>
              Branch: {ws.primaryBranch?.name || '—'}
              {ws.primaryBranch?.country ? ` (${ws.primaryBranch.country})` : ''}
            </p>
            <p>
              Start: {ws.startDate ? new Date(ws.startDate).toLocaleDateString() : '—'} · Inactive:{' '}
              {ws.inactiveDate ? new Date(ws.inactiveDate).toLocaleDateString() : '—'}
            </p>
            <div className="flex flex-wrap items-end gap-3 pt-2">
              <label className="block">
                <span className="text-xs text-vm-muted">Set classification (deliberate)</span>
                <select
                  className="mt-1 block rounded-lg border border-vm-border bg-white px-3 py-2"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                >
                  <option value="UNRESOLVED">UNRESOLVED</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="INDEPENDENT_CONTRACTOR">INDEPENDENT_CONTRACTOR</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-vm-muted">Payment preference</span>
                <select
                  className="mt-1 block rounded-lg border border-vm-border bg-white px-3 py-2"
                  value={paymentPreference}
                  onChange={(e) => setPaymentPreference(e.target.value)}
                >
                  <option value="">—</option>
                  <option value="ZELLE">ZELLE</option>
                  <option value="CHECK">CHECK</option>
                  <option value="ACH_PROVIDER">ACH_PROVIDER</option>
                  <option value="STRIPE_CONNECT">STRIPE_CONNECT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={saveClassification}
                className="rounded-lg bg-vm-navy px-4 py-2 font-heading text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-vm-muted">
            Documentation
          </h2>
          <p className="mt-3 font-body text-sm text-vm-navy">
            W-9 meta status: {record.documentation.w9MetaStatus}
          </p>
          <p className="mt-1 font-body text-xs text-vm-muted">
            Metadata only — no TIN stored. Not 1099 readiness.
          </p>
          {record.documentation.agreements.length === 0 ? (
            <p className="mt-2 font-body text-sm text-vm-muted">No worker agreements on file.</p>
          ) : (
            <ul className="mt-2 space-y-1 font-body text-sm">
              {record.documentation.agreements.map((a) => (
                <li key={a.id}>
                  {a.agreementType} v{a.agreementVersion} — {a.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-vm-muted">
            Payment preference
          </h2>
          <p className="mt-3 font-body text-sm text-vm-navy">
            {record.paymentPreference || '—'}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-vm-muted">
            Worker Compensation Summary
          </h2>
          <dl className="mt-3 grid gap-2 font-body text-sm text-vm-navy sm:grid-cols-2">
            <div>
              <dt className="text-vm-muted">Service earned</dt>
              <dd>{dollars(cs.serviceEarnedCents)}</dd>
            </div>
            <div>
              <dt className="text-vm-muted">Service paid</dt>
              <dd>{dollars(cs.servicePaidCents)}</dd>
            </div>
            <div>
              <dt className="text-vm-muted">Tips earned</dt>
              <dd>{dollars(cs.tipsEarnedCents)}</dd>
            </div>
            <div>
              <dt className="text-vm-muted">Tips paid</dt>
              <dd>{dollars(cs.tipsPaidCents)}</dd>
            </div>
            <div>
              <dt className="text-vm-muted">Total paid</dt>
              <dd>{dollars(cs.totalPaidCents)}</dd>
            </div>
            <div>
              <dt className="text-vm-muted">Outstanding payable</dt>
              <dd>{dollars(cs.outstandingPayableCents)}</dd>
            </div>
            <div>
              <dt className="text-vm-muted">Jobs completed</dt>
              <dd>{cs.jobsCompleted}</dd>
            </div>
          </dl>
          <p className="mt-2 font-body text-xs text-vm-muted">
            Sourced from JobPayout + Tip. Not a W-2 or 1099 report.
          </p>
        </section>
      </div>
    </div>
  );
}
