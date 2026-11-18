'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  Plus,
} from 'lucide-react';
import type { AdminJobListItem } from '@/components/admin/jobs/JobOperationsCard';
import { JobsMonthCalendar } from '@/components/admin/jobs/JobsMonthCalendar';
import { JobsMonthlySummaryStrip } from '@/components/admin/jobs/JobsMonthlySummaryStrip';
import { JobsScheduleRow } from '@/components/admin/jobs/JobsScheduleRow';
import { JobsWeekCalendar } from '@/components/admin/jobs/JobsWeekCalendar';
import { JobsWorkspacePanels } from '@/components/admin/jobs/JobsWorkspacePanels';
import type { DeskJobFlag } from '@/lib/flags/jobFlagDisplay';
import { useAdminShell } from '@/components/admin/shell/AdminShell';
import {
  addCalendarMonthKey,
  currentMonthKey,
  emptyMonthlySummary,
  easternWeekBounds,
  isDayKey,
  isMonthKey,
  type MonthlySummary,
} from '@/lib/admin/jobsMonthlyWorkspace';
import { easternDateKey, formatServiceDate } from '@/lib/dates/serviceDate';

const navyButton =
  'inline-flex min-h-[44px] items-center justify-center rounded-lg bg-vm-navy px-4 py-2 font-heading text-sm text-white transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan focus-visible:ring-offset-2';

const ghostButton =
  'inline-flex min-h-[40px] items-center justify-center rounded-lg border border-vm-border bg-vm-white px-3 py-1.5 font-body text-sm text-vm-navy outline-none transition-colors hover:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan';

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

function yearOptions(centerYear: number): number[] {
  return [centerYear - 1, centerYear, centerYear + 1, centerYear + 2];
}

function AdminJobsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isBranchScoped } = useAdminShell();

  const month = isMonthKey(searchParams.get('month'))
    ? searchParams.get('month')!
    : currentMonthKey();
  const day = isDayKey(searchParams.get('day')) ? searchParams.get('day')! : null;
  const view = searchParams.get('view') === 'list' ? 'list' : 'calendar';
  const focus = searchParams.get('focus') || 'all';
  const range = searchParams.get('range') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const branchFilter = searchParams.get('branchId') || 'all';
  const search = searchParams.get('search') || '';
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const includeArchived = searchParams.get('includeArchived') === 'true';
  const unassignedOnly =
    searchParams.get('unassignedOnly') === 'true' ||
    searchParams.get('needsAssignment') === '1';
  const customerIdFilter = searchParams.get('customerId') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  const [jobs, setJobs] = useState<AdminJobListItem[]>([]);
  const [openFlags, setOpenFlags] = useState<DeskJobFlag[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>(emptyMonthlySummary());
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [monthJobTotal, setMonthJobTotal] = useState(0);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [periodLabel, setPeriodLabel] = useState(month);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [searchDraft, setSearchDraft] = useState(search);
  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const monthPart = month.slice(5, 7);
  const yearPart = Number(month.slice(0, 4));

  const replaceParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `/admin/jobs?${qs}` : '/admin/jobs');
    },
    [router, searchParams]
  );

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const params = new URLSearchParams();
      params.set('month', month);
      params.set('view', view);
      params.set('page', String(page));
      params.set('pageSize', '50');
      if (day) params.set('day', day);
      if (focus && focus !== 'all') params.set('focus', focus);
      if (range) params.set('range', range);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (!isBranchScoped && branchFilter !== 'all') {
        params.set('branchId', branchFilter);
      }
      if (search) params.set('search', search);
      if (includeArchived) params.set('includeArchived', 'true');
      if (unassignedOnly) params.set('unassignedOnly', 'true');
      if (customerIdFilter) params.set('customerId', customerIdFilter);

      const res = await fetch(`/api/admin/jobs/monthly?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setJobs([]);
        setOpenFlags([]);
        setSummary(emptyMonthlySummary());
        setDayCounts({});
        setMonthJobTotal(0);
        setLoadFailed(true);
        return;
      }
      setJobs(data.jobs ?? []);
      setOpenFlags(Array.isArray(data.openFlags) ? data.openFlags : []);
      setSummary(data.summary ?? emptyMonthlySummary());
      setDayCounts(data.dayCounts ?? {});
      setMonthJobTotal(
        typeof data.monthJobTotal === 'number'
          ? data.monthJobTotal
          : Object.values(data.dayCounts ?? {}).reduce(
              (s: number, n) => s + Number(n),
              0
            )
      );
      setPagination(
        data.pagination ?? {
          page: 1,
          pageSize: 50,
          total: 0,
          totalPages: 1,
          hasMore: false,
        }
      );
      setPeriodLabel(data.periodLabel || month);
    } catch {
      setLoadFailed(true);
      setJobs([]);
      setOpenFlags([]);
      setSummary(emptyMonthlySummary());
      setDayCounts({});
      setMonthJobTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    month,
    day,
    view,
    focus,
    range,
    dateFrom,
    dateTo,
    statusFilter,
    branchFilter,
    search,
    page,
    includeArchived,
    unassignedOnly,
    customerIdFilter,
    isBranchScoped,
  ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  const goMonth = (delta: number) => {
    replaceParams((p) => {
      p.set('month', addCalendarMonthKey(month, delta));
      p.delete('day');
      p.delete('range');
      p.delete('dateFrom');
      p.delete('dateTo');
      p.set('page', '1');
    });
  };

  const setMonthYear = (nextYear: number, nextMonth: string) => {
    replaceParams((p) => {
      p.set('month', `${nextYear}-${nextMonth}`);
      p.delete('day');
      p.delete('range');
      p.delete('dateFrom');
      p.delete('dateTo');
      p.set('page', '1');
    });
  };

  const goToday = () => {
    const today = easternDateKey();
    replaceParams((p) => {
      p.set('month', today.slice(0, 7));
      p.set('day', today);
      p.delete('range');
      p.delete('dateFrom');
      p.delete('dateTo');
      p.set('page', '1');
    });
  };

  const goThisWeek = () => {
    replaceParams((p) => {
      p.set('range', 'week');
      p.delete('day');
      p.delete('dateFrom');
      p.delete('dateTo');
      p.set('page', '1');
    });
  };

  const goThisMonth = () => {
    replaceParams((p) => {
      p.set('month', currentMonthKey());
      p.delete('day');
      p.delete('range');
      p.delete('dateFrom');
      p.delete('dateTo');
      p.set('page', '1');
    });
  };

  const clearDay = () => {
    replaceParams((p) => {
      p.delete('day');
      p.set('page', '1');
    });
  };

  const applyCustomRange = () => {
    if (!isDayKey(customFrom) || !isDayKey(customTo)) return;
    replaceParams((p) => {
      p.set('range', 'custom');
      p.set('dateFrom', customFrom);
      p.set('dateTo', customTo);
      p.set('month', customFrom.slice(0, 7));
      p.delete('day');
      p.set('page', '1');
    });
  };

  const resetFilters = () => {
    router.replace(`/admin/jobs?month=${currentMonthKey()}&view=${view}`);
  };

  const scheduleHeading = day
    ? formatServiceDate(day, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : `Schedule · ${periodLabel}`;

  const sampleData =
    (process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV) !==
    'production';

  const weekAnchor =
    day ||
    (range === 'week' ? easternWeekBounds().startKey : null) ||
    easternDateKey();

  return (
    <div className="overflow-x-hidden p-4 pb-24 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-4 border-b border-vm-line pb-4">
          <div className="min-w-0">
            <h1 className="font-heading text-[33px] font-bold leading-[1.2] tracking-tight text-vm-navy">
              Jobs & Calendar
            </h1>
            <p className="mt-2 font-body text-sm text-vm-text">
              Calendar-first scheduling, dispatch and service status.
            </p>
            {customerIdFilter && (
              <p className="mt-1 font-body text-xs text-vm-cyan-dark">
                Filtered to one customer ·{' '}
                <button
                  type="button"
                  className="font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-vm-cyan"
                  onClick={() =>
                    replaceParams((p) => {
                      p.delete('customerId');
                      p.set('page', '1');
                    })
                  }
                >
                  Clear filter
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Period navigation */}
        <div className="mb-3 flex flex-col gap-2 rounded-xl border border-vm-border bg-vm-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Previous month"
              className={ghostButton}
              onClick={() => goMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <label className="sr-only" htmlFor="jobs-month">
              Month
            </label>
            <select
              id="jobs-month"
              value={monthPart}
              onChange={(e) => setMonthYear(yearPart, e.target.value)}
              className="min-h-[40px] rounded-lg border border-vm-border bg-vm-white px-2 py-1.5 font-heading text-sm font-semibold text-vm-navy outline-none focus:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="jobs-year">
              Year
            </label>
            <select
              id="jobs-year"
              value={yearPart}
              onChange={(e) => setMonthYear(Number(e.target.value), monthPart)}
              className="min-h-[40px] rounded-lg border border-vm-border bg-vm-white px-2 py-1.5 font-heading text-sm font-semibold text-vm-navy outline-none focus:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan"
            >
              {yearOptions(yearPart).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-label="Next month"
              className={ghostButton}
              onClick={() => goMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex flex-wrap gap-2">
              <button type="button" className={ghostButton} onClick={goToday}>
                Today
              </button>
              <button type="button" className={ghostButton} onClick={goThisWeek}>
                This week
              </button>
              <button type="button" className={ghostButton} onClick={goThisMonth}>
                This month
              </button>
            </div>

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                className={`${ghostButton} ${view === 'calendar' ? 'border-vm-cyan bg-vm-cyan/10' : ''}`}
                onClick={() =>
                  replaceParams((p) => {
                    p.set('view', 'calendar');
                  })
                }
              >
                <CalendarDays className="mr-1 h-4 w-4" />
                Calendar
              </button>
              <button
                type="button"
                className={`${ghostButton} ${view === 'list' ? 'border-vm-cyan bg-vm-cyan/10' : ''}`}
                onClick={() =>
                  replaceParams((p) => {
                    p.set('view', 'list');
                  })
                }
              >
                <List className="mr-1 h-4 w-4" />
                List
              </button>
            </div>
          </div>

          <button
            type="button"
            className={`${ghostButton} w-full justify-between sm:w-auto`}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            Filters & custom range
            <ChevronDown
              className={`ml-2 h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {filtersOpen && (
            <div className="flex flex-wrap items-end gap-2 border-t border-vm-border pt-3">
              <label className="flex flex-col gap-1 font-body text-xs text-vm-muted">
                From
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="min-h-[40px] rounded-lg border border-vm-border bg-vm-white px-2 py-1.5 text-sm text-vm-navy outline-none focus:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan"
                />
              </label>
              <label className="flex flex-col gap-1 font-body text-xs text-vm-muted">
                To
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="min-h-[40px] rounded-lg border border-vm-border bg-vm-white px-2 py-1.5 text-sm text-vm-navy outline-none focus:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan"
                />
              </label>
              <button type="button" className={ghostButton} onClick={applyCustomRange}>
                Apply range
              </button>

              <select
                value={statusFilter}
                onChange={(e) =>
                  replaceParams((p) => {
                    if (e.target.value === 'all') p.delete('status');
                    else p.set('status', e.target.value);
                    p.delete('focus');
                    p.set('page', '1');
                  })
                }
                className="min-h-[40px] rounded-lg border border-vm-border bg-vm-white px-3 py-1.5 font-body text-sm text-vm-navy outline-none focus:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan"
              >
                <option value="all">All statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ON_THE_WAY">On the way</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="AWAITING_QC">QC pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="CANCELLED_EMERGENCY">Emergency cancel</option>
              </select>

              {!isBranchScoped && (
                <select
                  value={branchFilter}
                  onChange={(e) =>
                    replaceParams((p) => {
                      if (e.target.value === 'all') p.delete('branchId');
                      else p.set('branchId', e.target.value);
                      p.set('page', '1');
                    })
                  }
                  className="min-h-[40px] rounded-lg border border-vm-border bg-vm-white px-3 py-1.5 font-body text-sm text-vm-navy outline-none focus:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan"
                >
                  <option value="all">All markets</option>
                  <option value="vermont">Vermont</option>
                  <option value="new-jersey">New Jersey</option>
                </select>
              )}

              <form
                className="flex min-w-[12rem] flex-1 flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  replaceParams((p) => {
                    if (searchDraft.trim()) p.set('search', searchDraft.trim());
                    else p.delete('search');
                    p.set('page', '1');
                  });
                }}
              >
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Search name, address, job ref…"
                  className="min-h-[40px] min-w-[10rem] flex-1 rounded-lg border border-vm-border bg-vm-white px-3 py-1.5 font-body text-sm text-vm-navy outline-none focus:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan"
                />
                <button type="submit" className={ghostButton}>
                  Search
                </button>
              </form>

              <label className="flex min-h-[40px] cursor-pointer items-center gap-2 font-body text-sm text-vm-muted">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) =>
                    replaceParams((p) => {
                      if (e.target.checked) {
                        p.set('unassignedOnly', 'true');
                        p.set('focus', 'unassigned');
                      } else {
                        p.delete('unassignedOnly');
                        p.delete('needsAssignment');
                        if (p.get('focus') === 'unassigned') p.delete('focus');
                      }
                      p.set('page', '1');
                    })
                  }
                  className="h-4 w-4 rounded border-vm-border"
                />
                Unassigned only
              </label>

              <label className="flex min-h-[40px] cursor-pointer items-center gap-2 font-body text-sm text-vm-muted">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) =>
                    replaceParams((p) => {
                      if (e.target.checked) p.set('includeArchived', 'true');
                      else p.delete('includeArchived');
                      p.set('page', '1');
                    })
                  }
                  className="h-4 w-4 rounded border-vm-border"
                />
                Show archived
              </label>

              <button type="button" className={ghostButton} onClick={resetFilters}>
                Reset
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-vm-cyan" />
            <p className="mt-3 font-body text-sm text-vm-muted">Loading schedule…</p>
          </div>
        ) : loadFailed ? (
          <div className="rounded-xl border border-vm-border bg-vm-white p-8 text-center">
            <p className="font-heading text-lg text-vm-navy">
              Jobs temporarily unavailable
            </p>
            <p className="mt-1 font-body text-sm text-vm-muted">
              This is not an empty schedule — the request failed.
            </p>
            <button type="button" onClick={fetchJobs} className={`mt-4 ${navyButton}`}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
            <div className="order-2 sm:order-1">
            <JobsMonthlySummaryStrip
              summary={summary}
              periodLabel={
                day
                  ? formatServiceDate(day, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : periodLabel
              }
              hideFinancial={isBranchScoped}
              activeFocus={focus}
              onFocus={(next) =>
                replaceParams((p) => {
                  if (next === 'all') p.delete('focus');
                  else p.set('focus', next);
                  if (next === 'unscheduled') p.delete('day');
                  p.set('page', '1');
                })
              }
            />

            <div className="mb-4 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
              <JobsWeekCalendar
                anchorDay={weekAnchor}
                jobs={jobs}
                dayCounts={dayCounts}
                selectedDay={day}
                sampleData={sampleData}
                onSelectDay={(key) =>
                  replaceParams((p) => {
                    p.set('day', key);
                    p.set('month', key.slice(0, 7));
                    p.delete('range');
                    p.delete('dateFrom');
                    p.delete('dateTo');
                    p.set('page', '1');
                  })
                }
              />
              <JobsWorkspacePanels
                jobs={jobs}
                openFlags={openFlags}
                sampleData={sampleData}
              />
            </div>

            {focus === 'past_incomplete' && (
              <div className="mb-3 rounded-lg border border-vm-warning/40 bg-vm-warning-bg px-4 py-3 font-body text-sm text-vm-navy">
                Past service date, not completed or cancelled. Confirm whether the
                clean happened before closing. Do not auto-complete.
              </div>
            )}
            </div>

            <div
              className={`order-1 grid gap-4 sm:order-2 ${
                view === 'calendar'
                  ? 'xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.25fr)]'
                  : ''
              }`}
            >
              {view === 'calendar' && (
                <JobsMonthCalendar
                  monthKey={month}
                  dayCounts={dayCounts}
                  monthTotal={monthJobTotal}
                  countScopeLabel={
                    focus && focus !== 'all' ? 'matching filter' : 'this month'
                  }
                  selectedDay={day}
                  onSelectDay={(key) =>
                    replaceParams((p) => {
                      p.set('day', key);
                      p.set('month', key.slice(0, 7));
                      p.delete('range');
                      p.delete('dateFrom');
                      p.delete('dateTo');
                      p.set('page', '1');
                    })
                  }
                  onSelectMonth={clearDay}
                />
              )}

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-heading text-sm font-semibold text-vm-navy">
                      {scheduleHeading}
                    </p>
                    {day && (
                      <button
                        type="button"
                        className="mt-0.5 font-body text-xs text-vm-cyan-dark outline-none hover:underline focus-visible:ring-2 focus-visible:ring-vm-cyan"
                        onClick={clearDay}
                      >
                        Entire month · clear day selection
                      </button>
                    )}
                  </div>
                  <p className="font-body text-xs text-vm-muted">
                    {pagination.total} job{pagination.total === 1 ? '' : 's'}
                    {pagination.totalPages > 1
                      ? ` · page ${pagination.page} of ${pagination.totalPages}`
                      : ''}
                  </p>
                </div>

                {jobs.length === 0 ? (
                  <div className="rounded-xl border border-vm-border bg-vm-white py-14 text-center">
                    <p className="font-heading text-lg text-vm-navy">
                      No jobs in this period
                    </p>
                    <p className="mt-1 font-body text-sm text-vm-muted">
                      Try another month, clear filters, or add a job manually.
                    </p>
                    <Link
                      href="/admin/jobs/new"
                      className={`mt-5 inline-flex ${navyButton}`}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Job Manually
                    </Link>
                  </div>
                ) : (
                  <ul className="overflow-hidden rounded-xl border border-vm-border bg-vm-white shadow-sm">
                    {jobs.map((job) => (
                      <JobsScheduleRow key={job.id} job={job} />
                    ))}
                  </ul>
                )}

                {pagination.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      className={ghostButton}
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        replaceParams((p) => {
                          p.set('page', String(Math.max(1, pagination.page - 1)));
                        })
                      }
                    >
                      Previous
                    </button>
                    <span className="font-body text-sm text-vm-muted">
                      Page {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      className={ghostButton}
                      disabled={!pagination.hasMore}
                      onClick={() =>
                        replaceParams((p) => {
                          p.set('page', String(pagination.page + 1));
                        })
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
        </div>
      }
    >
      <AdminJobsPageContent />
    </Suspense>
  );
}
