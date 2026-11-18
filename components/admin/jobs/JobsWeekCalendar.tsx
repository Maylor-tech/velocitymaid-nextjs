'use client';

import {
  buildWeekCalendarGrid,
  weekDayJobChipsFromJobs,
  weekDayVisibleChips,
  weekOfLabel,
  type WeekJobLabelInput,
} from '@/lib/admin/jobsMonthlyWorkspace';
import { formatServiceDate } from '@/lib/dates/serviceDate';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface JobsWeekCalendarProps {
  /** Any day in the week (YYYY-MM-DD). */
  anchorDay: string;
  jobs: WeekJobLabelInput[];
  dayCounts?: Record<string, number>;
  selectedDay?: string | null;
  onSelectDay?: (dayKey: string) => void;
  sampleData?: boolean;
}

function DayChips({ chips }: { chips: string[] }) {
  const { shown, moreLabel } = weekDayVisibleChips(chips, 2);
  if (shown.length === 0) return null;
  return (
    <div className="mt-1 flex flex-col gap-1">
      {shown.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className="text-[10px] font-bold leading-snug text-vm-cyan-dark"
        >
          {chip}
        </span>
      ))}
      {moreLabel ? (
        <span className="text-[10px] font-bold leading-snug text-vm-muted">
          {moreLabel}
        </span>
      ) : null}
    </div>
  );
}

export function JobsWeekCalendar({
  anchorDay,
  jobs,
  dayCounts = {},
  selectedDay = null,
  onSelectDay,
  sampleData = false,
}: JobsWeekCalendarProps) {
  const cells = buildWeekCalendarGrid(anchorDay);
  const chipsByDay = weekDayJobChipsFromJobs(jobs);
  const startKey = cells[0]?.key ?? anchorDay;
  const monthTitle = formatServiceDate(`${startKey.slice(0, 7)}-01`, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="rounded-[14px] border border-vm-line bg-white p-[23px] lg:col-span-2">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-bold leading-[1.2] tracking-tight text-vm-navy">
          {monthTitle} · {weekOfLabel(startKey)}
        </h2>
        {sampleData ? (
          <span className="rounded-full bg-vm-cyan-tint px-2.5 py-1 font-body text-[11px] font-bold text-vm-cyan-dark">
            Sample data
          </span>
        ) : null}
      </div>

      {/* Desktop / tablet: 7-column week grid (≥640px); 8px between header and tiles */}
      <div className="hidden grid-cols-7 gap-x-[5px] gap-y-2 font-body text-xs sm:grid">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-0 font-bold uppercase leading-none tracking-wide text-vm-muted"
          >
            {d}
          </div>
        ))}
        {cells.map((cell) => {
          const chips = chipsByDay[cell.key] ?? [];
          const count = dayCounts[cell.key] ?? 0;
          const hasJobs = chips.length > 0 || count > 0;
          const selected = selectedDay === cell.key;
          const Comp = onSelectDay ? 'button' : 'div';
          const ariaExtra =
            chips.length > 0
              ? `, ${chips.join(', ')}`
              : hasJobs
                ? `, ${count} jobs`
                : '';
          return (
            <Comp
              key={cell.key}
              type={onSelectDay ? 'button' : undefined}
              onClick={onSelectDay ? () => onSelectDay(cell.key) : undefined}
              aria-label={`${cell.key}${ariaExtra}`}
              aria-pressed={onSelectDay ? selected : undefined}
              className={`flex h-full min-h-[90px] flex-col rounded-[8px] p-2 text-left outline-none transition-colors ${
                onSelectDay
                  ? 'focus-visible:ring-2 focus-visible:ring-vm-cyan'
                  : ''
              } ${
                selected
                  ? 'border border-vm-cyan bg-vm-cyan/20 text-vm-navy'
                  : hasJobs
                    ? 'border border-vm-cyan/50 bg-vm-cyan-tint text-vm-navy'
                    : 'border border-transparent bg-vm-canvas text-vm-navy'
              }`}
            >
              <b className="font-heading text-sm font-bold">{cell.dayOfMonth}</b>
              <DayChips chips={chips} />
            </Comp>
          );
        })}
      </div>

      {/* Mobile: vertical agenda (<640px) — full labels, no truncation */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {cells.map((cell, index) => {
          const chips = chipsByDay[cell.key] ?? [];
          const hasJobs = chips.length > 0;
          const selected = selectedDay === cell.key;
          const dayMonth = formatServiceDate(cell.key, {
            month: 'short',
            day: 'numeric',
          });
          const Comp = onSelectDay ? 'button' : 'div';
          return (
            <li key={cell.key}>
              <Comp
                type={onSelectDay ? 'button' : undefined}
                onClick={onSelectDay ? () => onSelectDay(cell.key) : undefined}
                aria-pressed={onSelectDay ? selected : undefined}
                className={`flex w-full min-h-11 flex-col gap-2 rounded-[8px] p-3 text-left outline-none ${
                  onSelectDay
                    ? 'focus-visible:ring-2 focus-visible:ring-vm-cyan'
                    : ''
                } ${
                  selected
                    ? 'border border-vm-cyan bg-vm-cyan/20'
                    : hasJobs
                      ? 'border border-vm-cyan/50 bg-vm-cyan-tint'
                      : 'border border-transparent bg-vm-canvas'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-heading text-sm font-bold text-vm-navy">
                    {WEEKDAYS[index]}
                  </span>
                  <span className="font-body text-xs font-semibold text-vm-muted">
                    {dayMonth}
                  </span>
                </div>
                {chips.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {chips.map((chip, i) => (
                      <span
                        key={`${cell.key}-${i}-${chip}`}
                        className="rounded-md bg-white/80 px-2 py-1.5 font-body text-xs font-bold leading-snug text-vm-cyan-dark"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-body text-xs text-vm-muted">No jobs</span>
                )}
              </Comp>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default JobsWeekCalendar;
