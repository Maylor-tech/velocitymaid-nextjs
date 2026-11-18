'use client';

import {
  buildMonthCalendarGrid,
  type CalendarCell,
} from '@/lib/admin/jobsMonthlyWorkspace';
import { formatServiceDate } from '@/lib/dates/serviceDate';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface JobsMonthCalendarProps {
  monthKey: string;
  dayCounts: Record<string, number>;
  /** Month-level total (not the selected-day subset). */
  monthTotal?: number;
  /** When a focus/queue filter narrows markers, label that scope explicitly. */
  countScopeLabel?: string;
  selectedDay: string | null;
  onSelectDay: (dayKey: string) => void;
  onSelectMonth: () => void;
}

export function JobsMonthCalendar({
  monthKey,
  dayCounts,
  monthTotal,
  countScopeLabel = 'this month',
  selectedDay,
  onSelectDay,
  onSelectMonth,
}: JobsMonthCalendarProps) {
  const cells = buildMonthCalendarGrid(monthKey);
  const computedTotal = Object.entries(dayCounts)
    .filter(([k]) => k.startsWith(monthKey))
    .reduce((s, [, n]) => s + n, 0);
  const total = typeof monthTotal === 'number' ? monthTotal : computedTotal;

  return (
    <div className="rounded-[14px] border border-vm-line bg-vm-surface p-3 sm:p-[23px]">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-bold leading-[1.2] tracking-tight text-vm-navy">
          {formatServiceDate(`${monthKey}-01`, { month: 'long', year: 'numeric' })}
        </h2>
        <button
          type="button"
          onClick={onSelectMonth}
          className="min-h-[44px] rounded-md px-2 py-1 font-body text-xs font-bold text-vm-cyan-dark outline-none ring-vm-cyan hover:underline focus-visible:ring-2"
        >
          {total} {countScopeLabel}
          {selectedDay ? ' · show all' : ''}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center sm:gap-[5px]">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 font-body text-[10px] font-bold uppercase tracking-wide text-vm-muted sm:text-xs"
          >
            {d}
          </div>
        ))}
        {cells.map((cell) => (
          <DayCell
            key={cell.key}
            cell={cell}
            count={dayCounts[cell.key] ?? 0}
            selected={selectedDay === cell.key}
            onSelect={() => onSelectDay(cell.key)}
          />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  cell,
  count,
  selected,
  onSelect,
}: {
  cell: CalendarCell;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const muted = !cell.inMonth;
  const hasJobs = count > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={muted && count === 0}
      aria-label={`${cell.key}${count ? `, ${count} jobs` : ''}`}
      aria-pressed={selected}
      className={`flex min-h-[2.75rem] flex-col items-center justify-start rounded-lg border px-0.5 py-2 font-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-vm-cyan sm:min-h-[90px] ${
        selected
          ? 'border-vm-cyan bg-vm-cyan/20 text-vm-navy'
          : hasJobs && cell.inMonth
            ? 'border-vm-cyan/50 bg-vm-cyan-tint text-vm-navy'
          : cell.isToday
            ? 'border-vm-navy/40 bg-vm-canvas text-vm-navy'
            : 'border-transparent hover:border-vm-border hover:bg-vm-surface'
      } ${muted ? 'opacity-40' : ''}`}
    >
      <span
        className={`text-xs sm:text-sm ${
          cell.isToday ? 'font-semibold' : 'font-normal'
        }`}
      >
        {cell.dayOfMonth}
      </span>
      {count > 0 && (
        <span className="mt-0.5 rounded-full bg-vm-cyan/20 px-1.5 text-[10px] font-semibold text-vm-navy sm:text-xs">
          {count}
        </span>
      )}
    </button>
  );
}
