'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/admin/shell/AdminShell';
import { ActionCenter } from '@/components/admin/ops/ActionCenter';
import { OpsKpis } from '@/components/admin/ops/OpsKpis';
import { TodaySchedule } from '@/components/admin/ops/TodaySchedule';
import { ArPanel } from '@/components/admin/ops/ArPanel';
import { LeadPipelinePanel } from '@/components/admin/ops/LeadPipelinePanel';
import { PortalAdoptionPanel } from '@/components/admin/ops/PortalAdoptionPanel';
import { CleanerOpsPanel } from '@/components/admin/ops/CleanerOpsPanel';
import { PropertyAlerts } from '@/components/admin/ops/PropertyAlerts';
import { RecentActivity } from '@/components/admin/ops/RecentActivity';
import { QuickActions } from '@/components/admin/ops/QuickActions';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

function formatHeaderDate(branchScoped: boolean): string {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return `${day} · ${branchScoped ? 'Your market' : 'NJ & Vermont'}`;
}

export default function OpsCommandCenterPage() {
  const [data, setData] = useState<OpsCommandCenterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard/command-center', {
        cache: 'no-store',
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to load command center');
      }
      setData(json.data as OpsCommandCenterPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load command center');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const branchScoped = data?.branchScoped ?? false;

  return (
    <>
      <AdminPageHeader
        title="Daily Operations"
        subtitle={formatHeaderDate(branchScoped)}
        actions={
          <>
            <Button
              variant="navyOutline"
              size="sm"
              type="button"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link
              href="/admin/jobs/new"
              className="inline-flex h-9 items-center rounded-md bg-vm-navy px-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-white shadow-md transition-opacity hover:bg-vm-navy/90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New job
            </Link>
          </>
        }
      />

      <div className="p-7 pb-24">
        {loading && !data ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        ) : error && !data ? (
          <div className="rounded-lg border border-red-200 bg-vm-danger-bg p-6 text-vm-danger">
            {error}
            <Button
              variant="navyOutline"
              size="sm"
              type="button"
              className="ml-4"
              onClick={fetchData}
            >
              Retry
            </Button>
          </div>
        ) : data ? (
          <>
            <ActionCenter items={data.actionCenter} branchScoped={branchScoped} />
            <OpsKpis kpis={data.kpis} />
            <TodaySchedule rows={data.todaySchedule} />

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {!branchScoped ? (
                <>
                  <ArPanel data={data.accountsReceivable} />
                  <LeadPipelinePanel data={data.leadPipeline} />
                </>
              ) : (
                <div className="lg:col-span-2">
                  <LeadPipelinePanel data={data.leadPipeline} branchScoped />
                </div>
              )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PortalAdoptionPanel data={data.portalAdoption} branchScoped={branchScoped} />
              <CleanerOpsPanel data={data.cleanerOps} />
            </div>

            <PropertyAlerts alerts={data.propertyAlerts} />
            <RecentActivity items={data.recentActivity} />
            <QuickActions actions={data.quickActions} branchScoped={branchScoped} />
          </>
        ) : null}
      </div>
    </>
  );
}
