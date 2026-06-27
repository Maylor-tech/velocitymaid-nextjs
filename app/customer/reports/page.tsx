'use client';

import { useCallback } from 'react';
import { CustomerDocList } from '@/components/customer/CustomerDocList';

export default function CustomerReportsPage() {
  const mapRows = useCallback(
    (d: {
      reports?: Array<{
        id: string;
        reportNumber: string;
        propertyAddress: string;
        serviceDateFormatted: string;
        publicToken: string;
        status: string;
      }>;
    }) =>
      (d.reports || []).map((r) => ({
        id: r.id,
        label: r.propertyAddress,
        sublabel: `Report #${r.reportNumber}`,
        date: r.serviceDateFormatted,
        href: `/report/${r.publicToken}`,
        pdfHref: `/api/report/${r.publicToken}/pdf`,
        status: r.status,
      })),
    []
  );

  return (
    <CustomerDocList
      title="My Reports"
      empty="Completion reports will appear here after each finished service."
      fetchUrl="/api/customer/reports"
      mapRows={mapRows as (data: unknown) => ReturnType<typeof mapRows>}
    />
  );
}
