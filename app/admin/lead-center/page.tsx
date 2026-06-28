'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  UserPlus,
  FileText,
  RefreshCw,
  CalendarCheck,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import type { PipelineLeadStage } from '@prisma/client';
import { AdminPageHeader } from '@/components/admin/shell/AdminShell';
import { KpiCard } from '@/components/admin/ds/KpiCard';
import { Tabs } from '@/components/admin/ds/Tabs';
import { Button } from '@/components/ui/button';
import { LeadKanban } from '@/components/admin/leadCenter/LeadKanban';
import { LeadTableView } from '@/components/admin/leadCenter/LeadTableView';
import { LeadCalendarView } from '@/components/admin/leadCenter/LeadCalendarView';
import { LeadFormModal } from '@/components/admin/leadCenter/LeadFormModal';
import { LeadDetailPanel } from '@/components/admin/leadCenter/LeadDetailPanel';
import type {
  CreateLeadInput,
  LeadCenterDashboard,
  PipelineLeadRecord,
  PipelineLeadTaskRecord,
} from '@/lib/leadCenter/types';

type ViewMode = 'kanban' | 'table' | 'calendar';

function formatPipeline(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export default function LeadCommandCenterPage() {
  const [view, setView] = useState<ViewMode>('kanban');
  const [leads, setLeads] = useState<PipelineLeadRecord[]>([]);
  const [tasks, setTasks] = useState<PipelineLeadTaskRecord[]>([]);
  const [metrics, setMetrics] = useState<LeadCenterDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<PipelineLeadRecord | null>(null);
  const [selectedLead, setSelectedLead] = useState<PipelineLeadRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, leadsRes, tasksRes] = await Promise.all([
        fetch('/api/admin/lead-center/dashboard', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/lead-center/leads', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/lead-center/tasks?status=PENDING', {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      const dash = await dashRes.json();
      const leadsData = await leadsRes.json();
      const tasksData = await tasksRes.json();

      if (!dash.success || !leadsData.success) {
        throw new Error(dash.error || leadsData.error || 'Failed to load lead center');
      }

      setMetrics(dash.metrics);
      setLeads(leadsData.leads);
      setTasks(tasksData.success ? tasksData.tasks : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (data: CreateLeadInput) => {
    const res = await fetch('/api/admin/lead-center/leads', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
  };

  const handleUpdate = async (leadId: string, data: CreateLeadInput) => {
    const res = await fetch(`/api/admin/lead-center/leads/${leadId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setSelectedLead(json.lead);
    await load();
  };

  const handleStageChange = async (leadId: string, stage: PipelineLeadStage) => {
    const res = await fetch(`/api/admin/lead-center/leads/${leadId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    if (selectedLead?.id === leadId) setSelectedLead(json.lead);
    await load();
  };

  const handleCompleteTask = async (taskId: string) => {
    const res = await fetch(`/api/admin/lead-center/tasks/${taskId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
  };

  const viewTabs = [
    { value: 'kanban', label: 'Pipeline' },
    { value: 'table', label: 'Table' },
    { value: 'calendar', label: 'Follow-Up Calendar' },
  ];

  return (
    <div className="min-h-full">
      <AdminPageHeader
        title="Lead Command Center"
        subtitle="Pipeline · Quotes · Follow-ups · Vermont & New Jersey"
        actions={
          <Button variant="navy" onClick={() => { setEditLead(null); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Lead
          </Button>
        }
      />

      {loading && !metrics ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-vm-border bg-vm-white p-8 text-center">
          <p className="font-body text-sm text-vm-danger">{error}</p>
          <Button variant="navyOutline" className="mt-4" onClick={load}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {metrics && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KpiCard
                label="New Leads"
                value={metrics.newLeads}
                icon={<UserPlus className="h-5 w-5" />}
              />
              <KpiCard
                label="Active Quotes"
                value={metrics.activeQuotes}
                icon={<FileText className="h-5 w-5" />}
              />
              <KpiCard
                label="Recurring Clients"
                value={metrics.recurringClients}
                icon={<RefreshCw className="h-5 w-5" />}
              />
              <KpiCard
                label="Jobs Booked"
                value={metrics.jobsBooked}
                icon={<CalendarCheck className="h-5 w-5" />}
              />
              <KpiCard
                label="Conversion Rate"
                value={metrics.conversionRate != null ? `${metrics.conversionRate}%` : '—'}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <KpiCard
                label="Revenue Pipeline"
                value={formatPipeline(metrics.revenuePipeline)}
                icon={<DollarSign className="h-5 w-5" />}
              />
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs tabs={viewTabs} value={view} onChange={(v) => setView(v as ViewMode)} />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-vm-muted" />}
          </div>

          {view === 'kanban' && (
            <LeadKanban
              leads={leads}
              onSelect={setSelectedLead}
              onStageChange={handleStageChange}
            />
          )}
          {view === 'table' && (
            <LeadTableView leads={leads} onSelect={setSelectedLead} />
          )}
          {view === 'calendar' && (
            <LeadCalendarView
              leads={leads}
              tasks={tasks}
              onSelectLead={setSelectedLead}
              onCompleteTask={handleCompleteTask}
            />
          )}
        </>
      )}

      {selectedLead && (
        <>
          <div
            className="fixed inset-0 z-30 bg-vm-navy/20"
            onClick={() => setSelectedLead(null)}
            aria-hidden
          />
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onEdit={() => {
              setEditLead(selectedLead);
              setFormOpen(true);
            }}
            onStageChange={(stage) => handleStageChange(selectedLead.id, stage)}
          />
        </>
      )}

      <LeadFormModal
        open={formOpen}
        initial={editLead ?? undefined}
        onClose={() => {
          setFormOpen(false);
          setEditLead(null);
        }}
        onSave={async (data) => {
          if (editLead) {
            await handleUpdate(editLead.id, data);
          } else {
            await handleCreate(data);
          }
        }}
      />
    </div>
  );
}
