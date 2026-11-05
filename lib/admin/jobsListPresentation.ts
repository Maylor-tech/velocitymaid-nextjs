import { JOBS_BOARD_VIEWS, type JobsBoardView } from '@/lib/admin/jobsBoard';

export const JOBS_UNAVAILABLE_TITLE = 'Jobs temporarily unavailable';
export const JOBS_EMPTY_TITLE = 'No jobs found';

export type JobsBoardCounts = Record<JobsBoardView, number>;

export type JobsListPresentation =
  | { available: false; title: typeof JOBS_UNAVAILABLE_TITLE; boardCounts: null }
  | {
      available: true;
      title: typeof JOBS_EMPTY_TITLE | null;
      jobs: unknown[];
      summary: unknown;
      boardCounts: JobsBoardCounts;
    };

function isBoardCounts(value: unknown): value is JobsBoardCounts {
  if (!value || typeof value !== 'object') return false;
  const counts = value as Record<string, unknown>;
  return JOBS_BOARD_VIEWS.every((view) => {
    const count = counts[view];
    return typeof count === 'number' && Number.isInteger(count) && count >= 0;
  });
}

/**
 * A non-success response, including a database denial, is unavailable.
 * Count badges are omitted so an unread board is not shown as confirmed zeros.
 * A successful payload with an empty job list stays an empty result.
 */
export function presentJobsListResponse(status: number, body: unknown): JobsListPresentation {
  if (status < 200 || status >= 300 || !body || typeof body !== 'object') {
    return { available: false, title: JOBS_UNAVAILABLE_TITLE, boardCounts: null };
  }

  const record = body as Record<string, unknown>;
  if (record.success !== true || !Array.isArray(record.jobs) || !isBoardCounts(record.boardCounts)) {
    return { available: false, title: JOBS_UNAVAILABLE_TITLE, boardCounts: null };
  }

  return {
    available: true,
    title: record.jobs.length === 0 ? JOBS_EMPTY_TITLE : null,
    jobs: record.jobs,
    summary: record.summary ?? null,
    boardCounts: record.boardCounts,
  };
}
