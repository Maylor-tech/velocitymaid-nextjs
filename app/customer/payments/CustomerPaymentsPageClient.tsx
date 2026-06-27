'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CustomerDocList } from '@/components/customer/CustomerDocList';

type Tab = 'invoices' | 'receipts' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'invoices', label: 'Invoices' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'history', label: 'Payment History' },
];

export default function CustomerPaymentsPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: Tab =
    tabParam === 'receipts' || tabParam === 'history' ? tabParam : 'invoices';

  const invoiceMapRows = useCallback(
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

  const receiptMapRows = useCallback(
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

  const historyMapRows = useCallback(
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

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'receipts':
        return (
          <CustomerDocList
            title=""
            empty="Receipts appear here after payments are recorded."
            fetchUrl="/api/customer/receipts"
            mapRows={receiptMapRows as (data: unknown) => ReturnType<typeof receiptMapRows>}
          />
        );
      case 'history':
        return (
          <CustomerDocList
            title=""
            empty="Your payment history will appear here."
            fetchUrl="/api/customer/payment-history"
            mapRows={historyMapRows as (data: unknown) => ReturnType<typeof historyMapRows>}
          />
        );
      default:
        return (
          <CustomerDocList
            title=""
            empty="Invoices will appear here after completed services."
            fetchUrl="/api/customer/invoices"
            mapRows={invoiceMapRows as (data: unknown) => ReturnType<typeof invoiceMapRows>}
          />
        );
    }
  }, [activeTab, historyMapRows, invoiceMapRows, receiptMapRows]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-vm-navy mb-2">Payments</h1>
      <p className="font-body text-sm text-vm-muted mb-6">
        Invoices, receipts, and payment history in one place.
      </p>

      <div className="mb-6 flex gap-1 rounded-xl border border-vm-navy/10 bg-vm-white p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/customer/payments?tab=${tab.id}`}
            className={`flex-1 rounded-lg py-2.5 text-center text-sm font-body font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-vm-navy text-vm-white shadow-sm'
                : 'text-vm-muted hover:bg-vm-surface'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {tabContent}
    </div>
  );
}
