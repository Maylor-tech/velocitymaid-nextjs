'use client';

import { useCallback } from 'react';
import { CustomerDocList } from '@/components/customer/CustomerDocList';

export default function CustomerInvoicesPage() {
  const mapRows = useCallback(
    (d: {
      invoices?: Array<{
        id: string;
        invoiceNumber: string;
        propertyAddress: string;
        serviceType: string;
        balanceDueFormatted: string;
        statusLabel: string;
        publicToken: string;
      }>;
    }) =>
      (d.invoices || []).map((inv) => ({
        id: inv.id,
        label: inv.serviceType,
        sublabel: `${inv.propertyAddress} · #${inv.invoiceNumber}`,
        amount: inv.balanceDueFormatted !== '$0.00' ? `Due ${inv.balanceDueFormatted}` : 'Paid',
        href: `/invoice/${inv.publicToken}`,
        status: inv.statusLabel,
      })),
    []
  );

  return (
    <CustomerDocList
      title="My Invoices"
      empty="Invoices will appear here after completed services."
      fetchUrl="/api/customer/invoices"
      mapRows={mapRows as (data: unknown) => ReturnType<typeof mapRows>}
    />
  );
}
