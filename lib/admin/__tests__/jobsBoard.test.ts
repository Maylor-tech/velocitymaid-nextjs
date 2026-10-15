import { describe, expect, it } from 'vitest';
import {
  boardViewCounts,
  filterJobsBoardView,
  jobBoardView,
  sortJobsBoardView,
  type JobsBoardJob,
} from '../jobsBoard';
import {
  formatReceivedAt,
  getJobPriority,
  isOverduePayment,
  isPastDate,
  isToday,
} from '../jobsOperations';
import { getJobTriageReason } from '../jobTriage';

/** 13 Oct 2026 08:40 America/New_York (EDT, UTC-4). */
const NOW = new Date('2026-10-13T12:40:00.000Z');
/** 12 Oct 2026 23:59 EDT — still the 12th in Eastern. */
const BEFORE_MIDNIGHT_ET = new Date('2026-10-13T03:59:00.000Z');
/** 13 Oct 2026 00:00 EDT. */
const AT_MIDNIGHT_ET = new Date('2026-10-13T04:00:00.000Z');

const CHRIS: JobsBoardJob = {
  id: 'chris',
  status: 'ASSIGNED',
  preferredDate: '2026-09-16T00:00:00.000Z',
  createdAt: '2026-09-10T14:00:00.000Z',
};
const JEFF: JobsBoardJob = {
  id: 'jeff',
  status: 'ASSIGNED',
  preferredDate: '2026-09-23T00:00:00.000Z',
  createdAt: '2026-09-18T14:00:00.000Z',
};
const MAYO: JobsBoardJob = {
  id: 'mayo',
  status: 'CONFIRMED',
  preferredDate: '2026-10-11T00:00:00.000Z',
  createdAt: '2026-10-08T14:00:00.000Z',
};
const PIMPINELLA: JobsBoardJob = {
  id: 'pimpinella',
  status: 'RECEIVED',
  preferredDate: '2026-10-13T00:00:00.000Z',
  createdAt: '2026-10-12T18:00:00.000Z',
};

function ops(job: JobsBoardJob, extra: Record<string, unknown> = {}) {
  return {
    id: job.id,
    status: job.status,
    paymentStatus: 'PAID',
    preferredDate: job.preferredDate,
    createdAt: job.createdAt,
    ...extra,
  };
}

describe('Eastern service-date boundaries', () => {
  it('does not treat UTC-midnight Oct 13 as past during Eastern Oct 13 morning', () => {
    expect(isPastDate(PIMPINELLA.preferredDate, NOW)).toBe(false);
    expect(isToday(PIMPINELLA.preferredDate, NOW)).toBe(true);
    expect(isOverduePayment(ops(PIMPINELLA, { paymentStatus: 'PENDING' }), NOW)).toBe(
      false
    );
  });

  it('keeps Oct 13 in Inbox before Eastern midnight, not Exceptions', () => {
    expect(jobBoardView(PIMPINELLA, BEFORE_MIDNIGHT_ET)).toBe('inbox');
    expect(isPastDate(PIMPINELLA.preferredDate, BEFORE_MIDNIGHT_ET)).toBe(false);
  });

  it('classifies Oct 13 as today at Eastern midnight', () => {
    expect(isToday(PIMPINELLA.preferredDate, AT_MIDNIGHT_ET)).toBe(true);
    expect(jobBoardView(PIMPINELLA, AT_MIDNIGHT_ET)).toBe('inbox');
  });
});

describe('Gate 2 named exceptions stay out of Today / Upcoming / Completed', () => {
  it('Chris Sep 16, Jeff Sep 23, Tiffany Mayo Oct 11 are Exceptions', () => {
    expect(jobBoardView(CHRIS, NOW)).toBe('exceptions');
    expect(jobBoardView(JEFF, NOW)).toBe('exceptions');
    expect(jobBoardView(MAYO, NOW)).toBe('exceptions');
  });

  it('Tiffany Pimpinella Oct 13 RECEIVED is Inbox, not overdue', () => {
    expect(jobBoardView(PIMPINELLA, NOW)).toBe('inbox');
  });

  it('past RECEIVED is Exceptions, not Inbox', () => {
    const pastReceived: JobsBoardJob = {
      id: 'late-host',
      status: 'RECEIVED',
      preferredDate: '2026-10-01T00:00:00.000Z',
      createdAt: '2026-09-30T12:00:00.000Z',
    };
    expect(jobBoardView(pastReceived, NOW)).toBe('exceptions');
  });

  it('does not auto-complete anyone — COMPLETED is the only Completed member', () => {
    expect(jobBoardView(CHRIS, NOW)).not.toBe('completed');
    expect(jobBoardView({ ...CHRIS, status: 'COMPLETED' }, NOW)).toBe('completed');
  });
});

describe('priority classification', () => {
  it('labels past-open jobs Needs close, not Urgent', () => {
    expect(getJobPriority(ops(CHRIS), NOW)).toBe('needs_close');
    expect(getJobPriority(ops(JEFF), NOW)).toBe('needs_close');
    expect(getJobPriority(ops(MAYO), NOW)).toBe('needs_close');
    expect(getJobPriority(ops(CHRIS), NOW)).not.toBe('urgent');
    expect(getJobTriageReason(ops(CHRIS), NOW).label).toBe('Needs close');
  });

  it('does not mark a current RECEIVED job as Needs close', () => {
    expect(getJobPriority(ops(PIMPINELLA, { paymentStatus: 'PENDING' }), NOW)).not.toBe(
      'needs_close'
    );
  });
});

describe('board filtering and sorting', () => {
  const newerReceived: JobsBoardJob = {
    id: 'new-host',
    status: 'RECEIVED',
    preferredDate: '2026-10-20T00:00:00.000Z',
    createdAt: '2026-10-13T11:00:00.000Z',
  };
  const todayAssigned: JobsBoardJob = {
    id: 'today-dory',
    status: 'ASSIGNED',
    preferredDate: '2026-10-13T00:00:00.000Z',
    preferredTime: '10:00 AM',
    createdAt: '2026-10-01T12:00:00.000Z',
  };
  const upcoming: JobsBoardJob = {
    id: 'upcoming',
    status: 'ASSIGNED',
    preferredDate: '2026-10-20T00:00:00.000Z',
    preferredTime: '09:00 AM',
    createdAt: '2026-10-02T12:00:00.000Z',
  };
  const done: JobsBoardJob = {
    id: 'done',
    status: 'COMPLETED',
    preferredDate: '2026-10-10T00:00:00.000Z',
    completedAt: '2026-10-10T18:00:00.000Z',
    createdAt: '2026-10-01T12:00:00.000Z',
  };
  const cancelled: JobsBoardJob = {
    id: 'cx',
    status: 'CANCELLED',
    preferredDate: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-08-01T12:00:00.000Z',
  };

  const all = [
    CHRIS,
    JEFF,
    MAYO,
    PIMPINELLA,
    newerReceived,
    todayAssigned,
    upcoming,
    done,
    cancelled,
  ];

  it('puts a newer RECEIVED above an older RECEIVED in Inbox', () => {
    const inbox = sortJobsBoardView(filterJobsBoardView(all, 'inbox', NOW), 'inbox');
    expect(inbox.map((j) => j.id)).toEqual(['new-host', 'pimpinella']);
  });

  it('keeps Today to Eastern today scheduled jobs only', () => {
    const today = filterJobsBoardView(all, 'today', NOW);
    expect(today.map((j) => j.id)).toEqual(['today-dory']);
  });

  it('Upcoming is future scheduled, not RECEIVED and not past ASSIGNED', () => {
    const rows = filterJobsBoardView(all, 'upcoming', NOW);
    expect(rows.map((j) => j.id)).toEqual(['upcoming']);
  });

  it('Completed is COMPLETED only', () => {
    expect(filterJobsBoardView(all, 'completed', NOW).map((j) => j.id)).toEqual(['done']);
  });

  it('Exceptions are past-open only, oldest service date first', () => {
    const rows = sortJobsBoardView(
      filterJobsBoardView(all, 'exceptions', NOW),
      'exceptions'
    );
    expect(rows.map((j) => j.id)).toEqual(['chris', 'jeff', 'mayo']);
  });

  it('cancelled jobs are on no board', () => {
    expect(jobBoardView(cancelled, NOW)).toBeNull();
  });

  it('counts do not mix history into Inbox', () => {
    const counts = boardViewCounts(all, NOW);
    expect(counts.inbox).toBe(2);
    expect(counts.exceptions).toBe(3);
    expect(counts.today).toBe(1);
    expect(counts.upcoming).toBe(1);
    expect(counts.completed).toBe(1);
  });
});

describe('received-at timestamps', () => {
  it('formats createdAt in America/New_York', () => {
    expect(formatReceivedAt('2026-10-12T18:00:00.000Z')).toBe('Oct 12, 2026, 2:00 PM');
  });
});
