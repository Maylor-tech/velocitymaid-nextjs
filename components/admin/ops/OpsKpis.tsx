'use client';

import { Briefcase, DollarSign, Users, UserPlus, Wallet, Shield } from 'lucide-react';
import { KpiCard } from '@/components/admin/ds/KpiCard';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

export function OpsKpis({ kpis }: { kpis: OpsCommandCenterPayload['kpis'] }) {
  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Jobs this week"
          value={kpis.jobsThisWeek}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <KpiCard
          label="Revenue this month"
          value={kpis.revenueThisMonthFormatted}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          label="Outstanding balance"
          value={kpis.outstandingBalanceFormatted}
          subtitle={`${kpis.outstandingInvoices} invoices`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiCard
          label="Active clients"
          value={kpis.activeClients}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          label="Open leads"
          value={kpis.openLeads}
          icon={<UserPlus className="h-5 w-5" />}
        />
        <KpiCard
          label="Cleaner coverage"
          value={kpis.activeCleaners}
          subtitle={kpis.cleanerCoverage}
          icon={<Shield className="h-5 w-5" />}
        />
      </div>
    </section>
  );
}
