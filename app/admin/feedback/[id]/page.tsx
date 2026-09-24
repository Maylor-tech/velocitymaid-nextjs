'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

type Detail = {
  id: string;
  source?: string;
  status: string;
  overallRating: number | null;
  cleanlinessRating: number | null;
  communicationRating: number | null;
  timelinessRating: number | null;
  comment: string | null;
  submittedAt: string | null;
  dispositionCategory: string | null;
  adminNotes: string | null;
  opsClassification?: {
    opsClass: 'NORMAL' | 'CONCERN' | 'URGENT';
    issueTopic: string | null;
    reasons: string[];
  } | null;
  lowRating: boolean;
  cleanerResponse: string | null;
  customer: { firstName: string; lastName: string; email: string } | null;
  cleaner: { id: string; name: string | null; email: string } | null;
  property: {
    name: string;
    address: string;
    guestDisplayName?: string | null;
  } | null;
  job: {
    id: string;
    jobReference: string | null;
    address: string | null;
    internalNotes: string | null;
    status: string;
  };
  evidence: {
    completionReport: {
      reportNumber: string;
      publicToken: string;
      issuesFound: string | null;
    } | null;
    issuePhotos: Array<{ id: string; url: string; category: string }>;
    checklistCompleted: number;
    checklistTotal: number;
    escalations: Array<{ id: string; type: string; reason: string; status: string }>;
  };
  dispositionOptions: string[];
};

export default function AdminFeedbackDetailPage() {
  const params = useParams();
  const id = String(params.id || '');
  const [feedback, setFeedback] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [disposition, setDisposition] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setFeedback(data.feedback);
      setDisposition(data.feedback.dispositionCategory || '');
      setAdminNotes(data.feedback.adminNotes || '');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (
    action?: 'review' | 'release' | 'resolve' | 'resend_request'
  ) => {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispositionCategory: disposition || null,
          adminNotes,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');
      setMessage(
        action === 'resend_request'
          ? data.email?.sent
            ? 'Request email resent'
            : `Resend skipped: ${data.email?.skippedReason || data.email?.error || 'not sent'}`
          : 'Saved'
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="p-6">
        <p className="text-vm-danger">{message || 'Not found'}</p>
        <Link href="/admin/feedback" className="mt-4 inline-block text-vm-cyan-dark">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        href="/admin/feedback"
        className="mb-4 inline-flex items-center gap-1 text-sm text-vm-cyan-dark hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Feedback list
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-vm-navy">
            Service feedback
          </h1>
          <p className="font-body text-sm text-vm-muted">
            {feedback.job.jobReference || feedback.job.id} · {feedback.status}
            {feedback.lowRating ? ' · LOW RATING' : ''}
            {feedback.source ? ` · ${feedback.source}` : ''}
          </p>
          {feedback.opsClassification && (
            <p className="mt-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  feedback.opsClassification.opsClass === 'URGENT'
                    ? 'bg-vm-danger-bg text-vm-danger'
                    : feedback.opsClassification.opsClass === 'CONCERN'
                      ? 'bg-amber-50 text-amber-950'
                      : 'bg-vm-success-bg text-vm-success'
                }`}
              >
                {feedback.opsClassification.opsClass}
              </span>
              {feedback.opsClassification.issueTopic ? (
                <span className="ml-2 font-body text-xs text-vm-muted">
                  Guest topic: {feedback.opsClassification.issueTopic}
                </span>
              ) : null}
            </p>
          )}
        </div>
        <Link
          href={`/admin/jobs/${feedback.job.id}`}
          className="rounded-lg border border-vm-border px-3 py-2 text-sm text-vm-navy hover:bg-vm-surface"
        >
          Open job
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-vm-border bg-white p-5">
          <h2 className="font-heading font-semibold text-vm-navy">Ratings</h2>
          <dl className="mt-3 space-y-2 font-body text-sm">
            <Row label="Overall" value={feedback.overallRating} />
            <Row label="Cleanliness" value={feedback.cleanlinessRating} />
            <Row label="Communication" value={feedback.communicationRating} />
            <Row label="Timeliness" value={feedback.timelinessRating} />
          </dl>
          {feedback.comment && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-vm-muted">Comment</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-vm-navy">
                {feedback.comment}
              </p>
            </div>
          )}
          <div className="mt-4 space-y-1 text-sm text-vm-muted">
            <p>
              Customer:{' '}
              {feedback.customer
                ? `${feedback.customer.firstName} ${feedback.customer.lastName}`
                : '—'}
            </p>
            <p>Cleaner: {feedback.cleaner?.name || feedback.cleaner?.email || '—'}</p>
            <p>
              Property:{' '}
              {feedback.property?.guestDisplayName ||
                feedback.property?.name ||
                feedback.property?.address ||
                '—'}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-vm-border bg-white p-5">
          <h2 className="font-heading font-semibold text-vm-navy">Evidence</h2>
          <ul className="mt-3 space-y-2 font-body text-sm text-vm-muted">
            <li>
              Checklist: {feedback.evidence.checklistCompleted}/
              {feedback.evidence.checklistTotal}
            </li>
            <li>
              Completion report:{' '}
              {feedback.evidence.completionReport ? (
                <a
                  href={`/report/${feedback.evidence.completionReport.publicToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-vm-cyan-dark hover:underline"
                >
                  #{feedback.evidence.completionReport.reportNumber}
                </a>
              ) : (
                'none'
              )}
            </li>
            {feedback.evidence.completionReport?.issuesFound && (
              <li>Issues: {feedback.evidence.completionReport.issuesFound}</li>
            )}
            {feedback.job.internalNotes && (
              <li>Job notes: {feedback.job.internalNotes}</li>
            )}
            <li>Issue/damage photos: {feedback.evidence.issuePhotos.length}</li>
            <li>Escalations: {feedback.evidence.escalations.length}</li>
          </ul>
          {feedback.evidence.issuePhotos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {feedback.evidence.issuePhotos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.category}
                  className="h-20 w-full rounded object-cover"
                />
              ))}
            </div>
          )}
          {feedback.cleanerResponse && (
            <div className="mt-4 rounded-lg bg-vm-surface p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-vm-muted">
                Cleaner response (internal)
              </p>
              <p className="mt-1 whitespace-pre-wrap text-vm-navy">
                {feedback.cleanerResponse}
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-vm-border bg-white p-5">
        <h2 className="font-heading font-semibold text-vm-navy">Admin review</h2>
        <p className="mt-1 text-xs text-vm-muted">
          Feedback never changes cleaner pay automatically. Choose a disposition
          before releasing or resolving.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-vm-muted">
              Disposition
            </label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {feedback.dispositionOptions.map((d) => (
                <option key={d} value={d}>
                  {d.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-vm-muted">
              Admin notes
            </label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void patch('review')}
            className="rounded-lg border border-vm-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Mark under review
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void patch('release')}
            className="rounded-lg bg-vm-cyan px-4 py-2 text-sm font-semibold text-vm-navy disabled:opacity-50"
          >
            Release to cleaner
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void patch('resolve')}
            className="rounded-lg bg-vm-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Resolve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void patch()}
            className="rounded-lg border border-vm-border px-4 py-2 text-sm disabled:opacity-50"
          >
            Save notes
          </button>
          {feedback.status === 'REQUESTED' && !feedback.submittedAt ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch('resend_request')}
              className="rounded-lg border border-vm-cyan px-4 py-2 text-sm font-semibold text-vm-cyan-dark disabled:opacity-50"
            >
              Resend request email
            </button>
          ) : null}
        </div>
        {message && <p className="mt-3 text-sm text-vm-muted">{message}</p>}
        {feedback.lowRating ? (
          <p className="mt-3 text-xs text-amber-800">
            Low overall rating — review disposition before release. No automatic
            pay impact.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-vm-muted">{label}</dt>
      <dd className="font-semibold text-vm-navy">{value != null ? `${value}/5` : '—'}</dd>
    </div>
  );
}
