import { describe, expect, it } from 'vitest';
import {
  JOBS_EMPTY_TITLE,
  JOBS_UNAVAILABLE_TITLE,
  presentJobsListResponse,
} from '../jobsListPresentation';

const zeroCounts = { inbox: 0, today: 0, upcoming: 0, completed: 0, exceptions: 0 };

describe('jobs list presentation', () => {
  it('does not present a database denial as an empty board or confirmed zeros', () => {
    const presented = presentJobsListResponse(500, {
      success: false,
      error: 'Failed to list jobs',
      jobs: [],
      boardCounts: zeroCounts,
    });

    expect(presented).toEqual({
      available: false,
      title: JOBS_UNAVAILABLE_TITLE,
      boardCounts: null,
    });
    expect(presented.title).toBe('Jobs temporarily unavailable');
  });

  it('preserves a successful empty result and its confirmed zero counts', () => {
    const presented = presentJobsListResponse(200, {
      success: true,
      jobs: [],
      summary: { scheduledToday: 0 },
      boardCounts: zeroCounts,
    });

    expect(presented.available).toBe(true);
    if (!presented.available) return;
    expect(presented.title).toBe(JOBS_EMPTY_TITLE);
    expect(presented.title).toBe('No jobs found');
    expect(presented.jobs).toEqual([]);
    expect(presented.boardCounts).toEqual(zeroCounts);
  });

  it('does not invent zero counts when a success payload has no board counts', () => {
    const presented = presentJobsListResponse(200, {
      success: true,
      jobs: [],
      warning: 'Jobs temporarily unavailable',
    });

    expect(presented.boardCounts).toBeNull();
    expect(presented.title).toBe(JOBS_UNAVAILABLE_TITLE);
  });
});
