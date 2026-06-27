'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2 } from 'lucide-react';
import type { SerializedCompletionReport } from '@/lib/billing/serializeCompletionReport';

export default function PublicReportPage({ params }: { params: { token: string } }) {
  const [report, setReport] = useState<SerializedCompletionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/report/${params.token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReport(d.report);
      })
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface p-6">
        <p className="font-body text-vm-muted">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vm-surface py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-wider text-vm-cyan">Completion Report</p>
            <h1 className="font-heading text-2xl font-bold text-vm-navy">{report.propertyAddress}</h1>
            <p className="font-body text-sm text-vm-muted">{report.serviceDateFormatted} · #{report.reportNumber}</p>
          </div>
          <a
            href={`/api/report/${params.token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-4 py-2 font-body text-sm font-semibold text-white hover:bg-vm-navy/90"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>

        <div className="space-y-6 rounded-2xl border border-vm-border bg-vm-white p-6 shadow-sm">
          <Section label="Service">{report.serviceType || 'Professional cleaning'}</Section>
          <Section label="Team">{report.teamSummary || 'VelocityMaid certified team'}</Section>
          {report.notes && <Section label="Notes">{report.notes}</Section>}
          {report.issuesFound && <Section label="Issues found">{report.issuesFound}</Section>}
          {report.supplyRequests && <Section label="Supply requests">{report.supplyRequests}</Section>}
          <PhotoGrid label="Before photos" photos={report.beforePhotos} />
          <PhotoGrid label="After photos" photos={report.afterPhotos} />
        </div>

        <p className="mt-8 text-center font-body text-xs text-vm-muted">
          <Link href="/" className="text-vm-cyan-dark hover:underline">VelocityMaid</Link> · Come Home to Clean
        </p>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">{label}</p>
      <p className="mt-1 whitespace-pre-wrap font-body text-sm text-vm-navy">{children}</p>
    </div>
  );
}

function PhotoGrid({
  label,
  photos,
}: {
  label: string;
  photos: Array<{ url: string; caption?: string | null }>;
}) {
  if (!photos.length) return null;
  return (
    <div>
      <p className="font-heading text-xs font-bold uppercase tracking-wide text-vm-muted mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-vm-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption || label} className="h-32 w-full object-cover" />
            {p.caption && <p className="px-2 py-1 font-body text-xs text-vm-muted">{p.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
