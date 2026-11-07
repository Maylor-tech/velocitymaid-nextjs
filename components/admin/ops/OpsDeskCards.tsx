'use client';

import Link from 'next/link';
import type { OpsDesk } from '@/lib/admin/opsDeskData';

const cards = [
  { key: 'today', label: 'Today', href: '/admin?list=today' },
  { key: 'next7', label: 'Next 7 days', href: '/admin?list=next7' },
  { key: 'cleaner', label: 'Needs a cleaner', href: '/admin?list=cleaner' },
  { key: 'payment', label: 'Waiting on client payment', href: '/admin?list=payment' },
] as const;

export function OpsDeskCards({ desk }: { desk: OpsDesk }) {
  const values: Record<(typeof cards)[number]['key'], string> = {
    today: String(desk.cards.today),
    next7: String(desk.cards.next7Days),
    cleaner: String(desk.cards.needsCleaner),
    payment: String(desk.cards.waitingOnPayment),
  };

  return (
    <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="rounded-xl border border-vm-border bg-vm-white px-4 py-3 no-underline hover:border-vm-cyan"
        >
          <p className="font-body text-[10px] font-bold uppercase tracking-wider text-vm-muted">
            {card.label}
          </p>
          <p className="mt-1 font-heading text-xl font-semibold text-vm-navy">{values[card.key]}</p>
        </Link>
      ))}
      {desk.cards.unpaidInvoices && (
        <Link
          href="/admin/invoices"
          className="rounded-xl border border-vm-border bg-vm-white px-4 py-3 no-underline hover:border-vm-cyan"
        >
          <p className="font-body text-[10px] font-bold uppercase tracking-wider text-vm-muted">
            Unpaid invoices
          </p>
          <p className="mt-1 font-heading text-xl font-semibold text-vm-navy">
            {desk.cards.unpaidInvoices.formatted}
          </p>
          <p className="font-body text-xs text-vm-muted">
            {desk.cards.unpaidInvoices.count} open
          </p>
        </Link>
      )}
    </section>
  );
}
