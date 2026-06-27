'use client';

import { useCallback } from 'react';
import { CustomerDocList } from '@/components/customer/CustomerDocList';

export default function CustomerReceiptsPage() {
  const mapRows = useCallback(
    (d: {
      receipts?: Array<{
        id: string;
        receiptNumber: string;
        amountFormatted: string;
        paymentDateFormatted: string;
        propertyAddress?: string | null;
        publicToken: string;
      }>;
    }) =>
      (d.receipts || []).map((r) => ({
        id: r.id,
        label: `Receipt #${r.receiptNumber}`,
        sublabel: r.propertyAddress || undefined,
        date: r.paymentDateFormatted,
        amount: r.amountFormatted,
        href: `/receipt/${r.publicToken}`,
        pdfHref: `/api/receipt/${r.publicToken}/pdf`,
      })),
    []
  );

  return (
    <CustomerDocList
      title="My Receipts"
      empty="Receipts appear here after payments are recorded."
      fetchUrl="/api/customer/receipts"
      mapRows={mapRows as (data: unknown) => ReturnType<typeof mapRows>}
    />
  );
}
