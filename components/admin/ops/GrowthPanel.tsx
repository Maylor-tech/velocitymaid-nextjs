'use client';

import Link from 'next/link';
import type { OpsDesk } from '@/lib/admin/opsDeskData';

const items = [
  { key: 'newLeads', label: 'New leads not contacted', href: '/admin/lead-center' },
  { key: 'quoteFollowUps', label: 'Quotes due for follow-up', href: '/admin/lead-center' },
  { key: 'portalInvites', label: 'Portal invites not opened', href: '/admin/customers' },
] as const;

export function GrowthPanel({ growth }: { growth: OpsDesk['growth'] }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 font-heading text-lg font-semibold text-vm-navy">Growth</h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="block rounded-xl border border-vm-border bg-vm-white px-4 py-3 no-underline hover:border-vm-cyan"
            >
              <p className="font-heading text-xl font-semibold text-vm-navy">{growth[item.key]}</p>
              <p className="mt-1 font-body text-sm text-vm-muted">{item.label}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
