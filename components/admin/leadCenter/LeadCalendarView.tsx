'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PipelineLeadRecord, PipelineLeadTaskRecord } from '@/lib/leadCenter/types';
import { TASK_TYPE_LABELS } from '@/lib/leadCenter/types';

interface LeadCalendarViewProps {
  leads: PipelineLeadRecord[];
  tasks: PipelineLeadTaskRecord[];
  onSelectLead: (lead: PipelineLeadRecord) => void;
  onCompleteTask: (taskId: string) => void;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function LeadCalendarView({
  leads,
  tasks,
  onSelectLead,
  onCompleteTask,
}: LeadCalendarViewProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalDays = daysInMonth(cursor);
  const firstWeekday = cursor.getDay();
  const cells = Array.from({ length: firstWeekday + totalDays }, (_, i) =>
    i < firstWeekday ? null : i - firstWeekday + 1
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<number, Array<{ kind: 'lead' | 'task'; label: string; id: string; lead?: PipelineLeadRecord; task?: PipelineLeadTaskRecord }>>();

    for (const lead of leads) {
      if (!lead.nextActionDate) continue;
      const d = new Date(lead.nextActionDate);
      if (d.getMonth() !== cursor.getMonth() || d.getFullYear() !== cursor.getFullYear()) continue;
      const day = d.getDate();
      const list = map.get(day) ?? [];
      list.push({ kind: 'lead', label: lead.name, id: lead.id, lead });
      map.set(day, list);
    }

    for (const task of tasks) {
      if (task.status !== 'PENDING') continue;
      const d = new Date(task.dueAt);
      if (d.getMonth() !== cursor.getMonth() || d.getFullYear() !== cursor.getFullYear()) continue;
      const day = d.getDate();
      const list = map.get(day) ?? [];
      list.push({
        kind: 'task',
        label: task.lead?.name ? `${TASK_TYPE_LABELS[task.type]} — ${task.lead.name}` : task.title,
        id: task.id,
        task,
      });
      map.set(day, list);
    }

    return map;
  }, [leads, tasks, cursor]);

  const prevMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const nextMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  const today = new Date();

  return (
    <div className="rounded-xl border border-vm-border bg-vm-white">
      <div className="flex items-center justify-between border-b border-vm-border px-4 py-3">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-md p-1.5 text-vm-muted hover:bg-vm-surface"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-heading text-base font-semibold text-vm-navy">{monthLabel}</h3>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-md p-1.5 text-vm-muted hover:bg-vm-surface"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-vm-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="px-1 py-2 text-center font-body text-[11px] font-semibold uppercase text-vm-muted"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[88px] border-b border-r border-vm-border bg-vm-surface/40" />;
          }
          const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
          const isToday = sameDay(date, today);
          const events = eventsByDay.get(day) ?? [];

          return (
            <div
              key={day}
              className={`min-h-[88px] border-b border-r border-vm-border p-1 ${
                isToday ? 'bg-vm-cyan-tint/40' : ''
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-body text-xs ${
                  isToday ? 'bg-vm-cyan font-bold text-vm-navy' : 'text-vm-muted'
                }`}
              >
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {events.slice(0, 3).map((ev) => (
                  <button
                    key={`${ev.kind}-${ev.id}`}
                    type="button"
                    onClick={() => {
                      if (ev.kind === 'lead' && ev.lead) onSelectLead(ev.lead);
                      if (ev.kind === 'task' && ev.task) onCompleteTask(ev.task.id);
                    }}
                    className={`block w-full truncate rounded px-1 py-0.5 text-left font-body text-[10px] ${
                      ev.kind === 'task'
                        ? 'bg-vm-warning-bg text-vm-warning hover:opacity-80'
                        : 'bg-vm-cyan-tint text-vm-navy hover:bg-vm-cyan-tint/80'
                    }`}
                    title={ev.label}
                  >
                    {ev.label}
                  </button>
                ))}
                {events.length > 3 && (
                  <span className="px-1 font-body text-[10px] text-vm-muted">
                    +{events.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 px-4 py-3 font-body text-xs text-vm-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-vm-cyan-tint" /> Next action date
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-vm-warning-bg" /> Automated task (click to complete)
        </span>
      </div>
    </div>
  );
}
