'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CustomerReportView } from '@/components/customer/CustomerReportView';
import type { SerializedCompletionReport } from '@/lib/billing/serializeCompletionReport';

function baseReport(
  overrides: Partial<SerializedCompletionReport>
): SerializedCompletionReport {
  return {
    id: 'fixture-report',
    jobId: 'fixture-job',
    reportNumber: 'VM-R-1042',
    publicToken: 'fixture-token',
    propertyAddress: 'Fern Hill',
    serviceDate: '2026-11-18T00:00:00.000Z',
    serviceDateFormatted: 'Nov 18, 2026',
    serviceType: 'Vacation-rental turnover',
    teamSummary: 'Cleaned by VelocityMaid',
    notes: null,
    issuesFound: null,
    supplyRequests: null,
    beforePhotos: [],
    afterPhotos: [],
    arrivalCondition: 'NORMAL',
    invoicePublicToken: null,
    reviewStatus: 'PENDING',
    status: 'GENERATED',
    sentAt: null,
    createdAt: '2026-11-18T15:00:00.000Z',
    ...overrides,
  };
}

function CustomerReportVisualInner() {
  const searchParams = useSearchParams();
  const approved = searchParams.get('state') === 'approved';

  const report = approved
    ? baseReport({
        reviewStatus: 'APPROVED',
        status: 'SENT',
        sentAt: '2026-11-18T16:00:00.000Z',
        invoicePublicToken: null,
      })
    : baseReport({ reviewStatus: 'PENDING' });

  return (
    <CustomerReportView
      report={report}
      title="Fern Hill · Nov 18"
      activeNav="Reports"
      sampleNote
    />
  );
}

export function CustomerReportVisualClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-vm-canvas" />}>
      <CustomerReportVisualInner />
    </Suspense>
  );
}
