'use client';

import { useCallback } from 'react';
import { CustomerDocList } from '@/components/customer/CustomerDocList';

export default function CustomerPaymentHistoryPage() {
  const mapRows = useCallback(
    (d: {
      payments?: Array<{
        id: string;
        invoiceNumber: string;
        propertyAddress: string;
        amountFormatted: string;
        paymentDateFormatted: string;
        paymentMethod: string;
        receiptToken?: string | null;
      }>;
    }) =>
      (d.payments || []).map((p) => ({
        id: p.id,
        label: p.propertyAddress,
        sublabel: `Invoice #${p.invoiceNumber} · ${p.paymentMethod.replace(/_/g, ' ')}`,
        date: p.paymentDateFormatted,
        amount: p.amountFormatted,
        href: p.receiptToken ? `/receipt/${p.receiptToken}` : undefined,
        pdfHref: p.receiptToken ? `/api/receipt/${p.receiptToken}/pdf` : undefined,
      })),
    []
  );

  return (
    <CustomerDocList
      title="Payment History"
      empty="Your payment history will appear here."
      fetchUrl="/api/customer/payment-history"
      mapRows={mapRows as (data: unknown) => ReturnType<typeof mapRows>}
    />
  );
}
