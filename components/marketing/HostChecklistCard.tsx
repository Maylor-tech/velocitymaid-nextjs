'use client';

import { Download } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/trackEvent';

export const VERMONT_HOST_CHECKLIST_PATH = '/downloads/VelocityMaid_Vermont_Host_Checklist.pdf';

/**
 * Free 2-page sample of the VelocityMaid Vermont Host Kit (state compliance
 * checklist + required contact sign). A lead magnet for Vermont hosts.
 */
export function HostChecklistCard() {
  return (
    <section
      aria-labelledby="host-checklist-heading"
      className="rounded-xl border border-vm-border bg-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5"
    >
      <div className="flex-1">
        <p className="font-heading text-xs font-semibold uppercase tracking-wider text-vm-cyan-dark mb-1">
          Free for Vermont hosts
        </p>
        <h2 id="host-checklist-heading" className="font-heading font-bold text-vm-navy text-xl mb-2">
          Vermont Host Checklist
        </h2>
        <p className="text-sm text-vm-muted font-body max-w-2xl">
          The state requirements every Vermont short-term rental host should work through, and the
          contact sign the state asks you to post inside the unit. Two printable pages. A practical
          guide, not legal or tax advice.
        </p>
      </div>
      <a
        href={VERMONT_HOST_CHECKLIST_PATH}
        download
        onClick={() => trackEvent('host_checklist_download', { location: 'vermont_overview' })}
        className="inline-flex items-center justify-center gap-2 bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-5 py-3 text-sm hover:bg-vm-cyan/90 transition shrink-0"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download the free PDF
      </a>
    </section>
  );
}
