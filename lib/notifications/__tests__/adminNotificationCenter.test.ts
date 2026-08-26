import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFirst = vi.fn();
const create = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminNotification: {
      findFirst: (...a: unknown[]) => findFirst(...a),
      create: (...a: unknown[]) => create(...a),
    },
  },
}));

import { createAdminNotification } from '../adminNotificationCenter';

describe('createAdminNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('awaits the write and returns the row id', async () => {
    create.mockResolvedValue({ id: 'notif-1' });
    const result = await createAdminNotification({
      type: 'HOST_CLEANING_REQUEST',
      severity: 'INFO',
      message: 'Host cleaning request VM-1',
      jobId: 'job-1',
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      created: true,
      id: 'notif-1',
    });
  });

  it('is idempotent for the same job + type when requested', async () => {
    findFirst.mockResolvedValue({ id: 'existing' });
    const first = await createAdminNotification({
      type: 'HOST_CLEANING_REQUEST',
      severity: 'INFO',
      message: 'Host cleaning request VM-1',
      jobId: 'job-1',
      idempotent: true,
    });
    const second = await createAdminNotification({
      type: 'HOST_CLEANING_REQUEST',
      severity: 'INFO',
      message: 'Host cleaning request VM-1',
      jobId: 'job-1',
      idempotent: true,
    });
    expect(create).not.toHaveBeenCalled();
    expect(first).toEqual({ ok: true, created: false, id: 'existing' });
    expect(second).toEqual({ ok: true, created: false, id: 'existing' });
  });

  it('surfaces write failure without throwing', async () => {
    findFirst.mockResolvedValue(null);
    create.mockRejectedValue(new Error('db down'));
    const result = await createAdminNotification({
      type: 'HOST_CLEANING_REQUEST',
      severity: 'INFO',
      message: 'Host cleaning request VM-1',
      jobId: 'job-1',
      idempotent: true,
    });
    expect(result.ok).toBe(false);
    expect(result.created).toBe(false);
    expect(result.id).toBeNull();
    expect(result.error).toBe('db down');
  });
});
