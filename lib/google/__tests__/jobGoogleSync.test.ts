/**
 * Await wrappers must complete Google work before the caller continues and must
 * never throw — so serverless request handlers can await them after a committed
 * Job mutation without turning Google outages into HTTP failures.
 *
 * Deprecated queue* helpers remain as fire-and-forget shims.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  syncJobToGoogle: vi.fn(),
  syncJobCalendarEvent: vi.fn(),
  cancelJobCalendarEventById: vi.fn(),
}));

vi.mock('../syncJobToGoogle', () => ({
  syncJobToGoogle: (...args: unknown[]) => mocks.syncJobToGoogle(...args),
}));

vi.mock('../calendar', () => ({
  syncJobCalendarEvent: (...args: unknown[]) => mocks.syncJobCalendarEvent(...args),
  cancelJobCalendarEventById: (...args: unknown[]) => mocks.cancelJobCalendarEventById(...args),
}));

import {
  awaitJobGoogleSync,
  awaitJobCalendarSync,
  awaitJobCalendarCancel,
  queueJobGoogleSync,
  queueJobCalendarSync,
  queueJobCalendarCancel,
} from '../jobGoogleSync';

describe('jobGoogleSync await helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.syncJobToGoogle.mockResolvedValue({ jobId: 'job-1' });
    mocks.syncJobCalendarEvent.mockResolvedValue(undefined);
    mocks.cancelJobCalendarEventById.mockResolvedValue(undefined);
  });

  it('awaitJobGoogleSync awaits sync and never throws when sync rejects', async () => {
    mocks.syncJobToGoogle.mockRejectedValue(new Error('Google down'));
    await expect(awaitJobGoogleSync('job-1')).resolves.toBeUndefined();
    expect(mocks.syncJobToGoogle).toHaveBeenCalledWith('job-1');
  });

  it('awaitJobGoogleSync completes before caller continues when sync succeeds', async () => {
    let finished = false;
    mocks.syncJobToGoogle.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      finished = true;
      return { jobId: 'job-1' };
    });
    await awaitJobGoogleSync('job-1');
    expect(finished).toBe(true);
  });

  it('awaitJobCalendarSync awaits calendar sync and never throws', async () => {
    mocks.syncJobCalendarEvent.mockRejectedValue(new Error('Calendar down'));
    await expect(awaitJobCalendarSync('job-1')).resolves.toBeUndefined();
    expect(mocks.syncJobCalendarEvent).toHaveBeenCalledWith('job-1');
  });

  it('awaitJobCalendarSync completes before caller continues', async () => {
    let finished = false;
    mocks.syncJobCalendarEvent.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      finished = true;
    });
    await awaitJobCalendarSync('job-1');
    expect(finished).toBe(true);
  });

  it('awaitJobCalendarCancel awaits cancel and never throws', async () => {
    mocks.cancelJobCalendarEventById.mockRejectedValue(new Error('Cancel failed'));
    await expect(awaitJobCalendarCancel('job-1')).resolves.toBeUndefined();
    expect(mocks.cancelJobCalendarEventById).toHaveBeenCalledWith('job-1');
  });

  it('awaitJobCalendarCancel completes before caller continues (first cancel attempt)', async () => {
    let finished = false;
    mocks.cancelJobCalendarEventById.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      finished = true;
    });
    await awaitJobCalendarCancel('job-1');
    expect(finished).toBe(true);
    expect(mocks.cancelJobCalendarEventById).toHaveBeenCalledTimes(1);
  });

  it('queueJobGoogleSync still invokes sync without throwing when sync rejects', async () => {
    mocks.syncJobToGoogle.mockRejectedValue(new Error('Google down'));
    expect(() => queueJobGoogleSync('job-1')).not.toThrow();
    await vi.waitFor(() => {
      expect(mocks.syncJobToGoogle).toHaveBeenCalledWith('job-1');
    });
  });

  it('queueJobCalendarSync still invokes calendar sync and swallows failures', async () => {
    mocks.syncJobCalendarEvent.mockRejectedValue(new Error('Calendar down'));
    expect(() => queueJobCalendarSync('job-1')).not.toThrow();
    await vi.waitFor(() => {
      expect(mocks.syncJobCalendarEvent).toHaveBeenCalledWith('job-1');
    });
  });

  it('queueJobCalendarCancel still invokes cancel and swallows failures', async () => {
    mocks.cancelJobCalendarEventById.mockRejectedValue(new Error('Cancel failed'));
    expect(() => queueJobCalendarCancel('job-1')).not.toThrow();
    await vi.waitFor(() => {
      expect(mocks.cancelJobCalendarEventById).toHaveBeenCalledWith('job-1');
    });
  });
});
