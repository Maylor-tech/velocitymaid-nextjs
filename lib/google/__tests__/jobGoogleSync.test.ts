/**
 * Fire-and-forget queue wrappers must not await sync completion and must
 * swallow rejections so job APIs are never blocked by Google failures.
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
  queueJobGoogleSync,
  queueJobCalendarSync,
  queueJobCalendarCancel,
} from '../jobGoogleSync';

describe('jobGoogleSync queue helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.syncJobToGoogle.mockResolvedValue({ jobId: 'job-1' });
    mocks.syncJobCalendarEvent.mockResolvedValue(undefined);
    mocks.cancelJobCalendarEventById.mockResolvedValue(undefined);
  });

  it('queueJobGoogleSync invokes syncJobToGoogle without throwing when sync rejects', async () => {
    mocks.syncJobToGoogle.mockRejectedValue(new Error('Google down'));
    expect(() => queueJobGoogleSync('job-1')).not.toThrow();
    await vi.waitFor(() => {
      expect(mocks.syncJobToGoogle).toHaveBeenCalledWith('job-1');
    });
  });

  it('queueJobCalendarSync invokes calendar sync and swallows failures', async () => {
    mocks.syncJobCalendarEvent.mockRejectedValue(new Error('Calendar down'));
    expect(() => queueJobCalendarSync('job-1')).not.toThrow();
    await vi.waitFor(() => {
      expect(mocks.syncJobCalendarEvent).toHaveBeenCalledWith('job-1');
    });
  });

  it('queueJobCalendarCancel invokes cancel and swallows failures', async () => {
    mocks.cancelJobCalendarEventById.mockRejectedValue(new Error('Cancel failed'));
    expect(() => queueJobCalendarCancel('job-1')).not.toThrow();
    await vi.waitFor(() => {
      expect(mocks.cancelJobCalendarEventById).toHaveBeenCalledWith('job-1');
    });
  });
});
