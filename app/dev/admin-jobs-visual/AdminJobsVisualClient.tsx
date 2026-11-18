'use client';

import { AdminShell } from '@/components/admin/shell/AdminShell';
import { JobsWeekCalendar } from '@/components/admin/jobs/JobsWeekCalendar';
import { JobsWorkspacePanels } from '@/components/admin/jobs/JobsWorkspacePanels';
import { JobsMonthlySummaryStrip } from '@/components/admin/jobs/JobsMonthlySummaryStrip';
import type { AdminJobListItem } from '@/components/admin/jobs/JobOperationsCard';
import { emptyMonthlySummary } from '@/lib/admin/jobsMonthlyWorkspace';

const summary = {
  ...emptyMonthlySummary(),
  confirmedBookings: 12,
  needsCleaner: 3,
  bookingRequests: 2,
  qcPendingJobs: 1,
  totalInScope: 18,
};

const fixtureJobs: AdminJobListItem[] = [
  {
    id: 'fixture-offer',
    customerName: 'Host A',
    preferredDate: '2026-11-18T00:00:00.000Z',
    preferredTime: null,
    serviceType: 'Turnover',
    address: null,
    totalPrice: null,
    currency: 'USD',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    reviewStatus: 'PENDING',
    assignedCleanerId: null,
    assignedCleaner: null,
    branch: { id: 'vt', name: 'Vermont', slug: 'vermont' },
    property: {
      id: 'p1',
      name: 'Fern Hill',
      address: '',
      guestDisplayName: null,
    },
    openOffer: {
      id: 'o1',
      status: 'OFFERED',
      expiresAt: '2026-11-19T00:00:00.000Z',
      cleanerName: 'Alex',
    },
  },
  {
    id: 'fixture-unassigned',
    customerName: 'Host B',
    preferredDate: '2026-11-20T00:00:00.000Z',
    preferredTime: null,
    serviceType: 'Turnover',
    address: null,
    totalPrice: null,
    currency: 'USD',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    reviewStatus: 'PENDING',
    assignedCleanerId: null,
    assignedCleaner: null,
    branch: { id: 'vt', name: 'Vermont', slug: 'vermont' },
    property: {
      id: 'p2',
      name: 'Lakeside cabin',
      address: '',
      guestDisplayName: null,
    },
    openOffer: null,
  },
  {
    id: 'fixture-qc',
    customerName: 'Host C',
    preferredDate: '2026-11-16T00:00:00.000Z',
    preferredTime: null,
    serviceType: 'Deep clean',
    address: null,
    totalPrice: null,
    currency: 'USD',
    status: 'AWAITING_QC',
    paymentStatus: 'PENDING',
    reviewStatus: 'PENDING',
    assignedCleanerId: 'c1',
    assignedCleaner: { id: 'c1', name: 'Sam', email: 'sam@example.test' },
    branch: { id: 'vt', name: 'Vermont', slug: 'vermont' },
    property: {
      id: 'p3',
      name: 'Maple Ridge',
      address: '',
      guestDisplayName: null,
    },
    openOffer: null,
  },
  {
    id: 'fixture-turnover-2',
    customerName: 'Host D',
    preferredDate: '2026-11-20T00:00:00.000Z',
    preferredTime: null,
    serviceType: 'Turnover',
    address: null,
    totalPrice: null,
    currency: 'USD',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    reviewStatus: 'PENDING',
    assignedCleanerId: null,
    assignedCleaner: null,
    branch: { id: 'vt', name: 'Vermont', slug: 'vermont' },
    property: {
      id: 'p4',
      name: 'Birch Cottage',
      address: '',
      guestDisplayName: null,
    },
    openOffer: null,
  },
];

const dayCounts: Record<string, number> = {
  '2026-11-16': 1,
  '2026-11-18': 1,
  '2026-11-20': 2,
};

/** Owner-role shell so all 8 handoff nav sections appear in screenshots. */
export function AdminJobsVisualClient() {
  return (
    <AdminShell
      userEmail="owner@velocitymaid.test"
      isOwner
      isBranchScoped={false}
      branchName="Vermont"
      activePath="/admin/jobs"
    >
      <div className="overflow-x-hidden p-4 pb-24 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mb-4 border-b border-vm-line pb-4">
            <h1 className="font-heading text-[33px] font-bold leading-[1.2] tracking-tight text-vm-navy">
              Jobs & Calendar
            </h1>
            <p className="mt-2 font-body text-sm text-vm-text">
              Calendar-first scheduling, dispatch and service status.
            </p>
          </div>

          <JobsMonthlySummaryStrip
            summary={summary}
            periodLabel="November 2026"
            activeFocus="all"
            onFocus={() => {}}
          />

          <div className="mb-4 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
            <JobsWeekCalendar
              anchorDay="2026-11-18"
              jobs={fixtureJobs}
              dayCounts={dayCounts}
              sampleData
            />
            <JobsWorkspacePanels jobs={fixtureJobs} sampleData />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
