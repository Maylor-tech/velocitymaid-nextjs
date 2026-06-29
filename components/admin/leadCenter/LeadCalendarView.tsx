'use client';

import { useMemo } from 'react';
import { MapPin, Clock, AlertTriangle } from 'lucide-react';
import type { PipelineLeadRecord } from '@/lib/leadCenter/types';
import { effectiveFollowUpDate, daysSince } from '@/lib/leadCenter/stages';
import { Button } from '@/components/ui/button';

interface LeadCalendarViewProps {
  leads: PipelineLeadRecord[];
  onSelectLead: (lead: PipelineLeadRecord) => void;
  onMarkContacted: (leadId: string) => void;
  onMoveToWon: (leadId: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function LeadCalendarView({
  leads,
  onSelectLead,
  onMarkContacted,
  onMoveToWon,
}: LeadCalendarViewProps) {
  const followUpLeads = useMemo(() => {
    return leads
      .filter((l) => l.stage === 'FOLLOW_UP')
      .map((lead) => {
        const due = effectiveFollowUpDate({
          followUpDate: lead.followUpDate ? new Date(lead.followUpDate) : null,
          followUpEnteredAt: lead.followUpEnteredAt ? new Date(lead.followUpEnteredAt) : null,
        });
        const overdue = due ? due.getTime() < Date.now() : false;
        const daysIdle = daysSince(
          lead.lastContactedAt ? new Date(lead.lastContactedAt) : new Date(lead.updatedAt)
        );
        return { lead, due, overdue, daysIdle };
      })
      .sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.getTime() - b.due.getTime();
      });
  }, [leads]);

  const overdue = followUpLeads.filter((x) => x.overdue);
  const upcoming = followUpLeads.filter((x) => !x.overdue);

  if (followUpLeads.length === 0) {
    return (
      <div className="rounded-xl border border-vm-border bg-vm-white px-6 py-12 text-center">
        <p className="font-body text-sm text-vm-muted">
          No leads in Follow-Up stage. Move a quoted lead to Follow-Up to track it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <FollowUpSection
          title="Overdue"
          icon={<AlertTriangle className="h-4 w-4 text-vm-warning" />}
          items={overdue}
          highlight
          onSelectLead={onSelectLead}
          onMarkContacted={onMarkContacted}
          onMoveToWon={onMoveToWon}
        />
      )}
      <FollowUpSection
        title={overdue.length > 0 ? 'Upcoming' : 'Follow-ups due'}
        icon={<Clock className="h-4 w-4 text-vm-muted" />}
        items={upcoming.length > 0 ? upcoming : followUpLeads}
        highlight={false}
        onSelectLead={onSelectLead}
        onMarkContacted={onMarkContacted}
        onMoveToWon={onMoveToWon}
      />
    </div>
  );
}

function FollowUpSection({
  title,
  icon,
  items,
  highlight,
  onSelectLead,
  onMarkContacted,
  onMoveToWon,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{
    lead: PipelineLeadRecord;
    due: Date | null;
    overdue: boolean;
    daysIdle: number | null;
  }>;
  highlight: boolean;
  onSelectLead: (lead: PipelineLeadRecord) => void;
  onMarkContacted: (leadId: string) => void;
  onMoveToWon: (leadId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-vm-border bg-vm-white">
      <div className="flex items-center gap-2 border-b border-vm-border px-4 py-3">
        {icon}
        <h3 className="font-heading text-sm font-semibold text-vm-navy">{title}</h3>
        <span className="ml-auto rounded-full bg-vm-surface px-2 py-0.5 font-body text-xs font-semibold text-vm-muted">
          {items.length}
        </span>
      </div>
      <ul className="divide-y divide-vm-border">
        {items.map(({ lead, due, overdue, daysIdle }) => (
          <li
            key={lead.id}
            className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
              highlight || overdue ? 'bg-vm-warning-bg/50' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectLead(lead)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="font-heading text-sm font-semibold text-vm-navy">{lead.name}</p>
              {lead.propertyAddress && (
                <p className="mt-0.5 flex items-center gap-1 font-body text-xs text-vm-muted">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{lead.propertyAddress}</span>
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-3 font-body text-xs text-vm-muted">
                <span>
                  Follow-up:{' '}
                  <strong className={overdue ? 'text-vm-warning' : 'text-vm-navy'}>
                    {due ? formatDate(due.toISOString()) : 'Not set'}
                  </strong>
                  {overdue && ' · Overdue'}
                </span>
                {daysIdle != null && (
                  <span>{daysIdle === 0 ? 'Contacted today' : `${daysIdle}d since last contact`}</span>
                )}
              </div>
            </button>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="navyOutline"
                className="text-xs"
                onClick={() => onMarkContacted(lead.id)}
              >
                Mark contacted
              </Button>
              <Button
                type="button"
                variant="navy"
                className="text-xs"
                onClick={() => onMoveToWon(lead.id)}
              >
                Move to Won
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
