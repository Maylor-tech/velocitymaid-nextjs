'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { SerializedCompletionReport } from '@/lib/billing/serializeCompletionReport';
import { CustomerReportView } from '@/components/customer/CustomerReportView';
import { formatServiceDate } from '@/lib/dates/serviceDate';

function reportTitle(report: SerializedCompletionReport): string {
  const shortDate = formatServiceDate(report.serviceDate, {
    month: 'short',
    day: 'numeric',
  });
  return `${report.propertyAddress} · ${shortDate}`;
}

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
      <div className="flex min-h-screen items-center justify-center bg-vm-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-canvas p-6">
        <p className="font-body text-vm-muted">Report not found.</p>
      </div>
    );
  }

  return (
    <CustomerReportView
      report={report}
      title={reportTitle(report)}
      activeNav="Reports"
      pdfHref={
        report.reviewStatus === 'APPROVED'
          ? `/api/report/${params.token}/pdf`
          : null
      }
    />
  );
}
