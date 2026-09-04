import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const logAuditEntry = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => findUnique(...a) },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => logAuditEntry(...a),
}));

import { escalateJobIssue } from '@/lib/pilot/dayOfJob';

describe('escalateJobIssue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue({
      id: 'job-1',
      customerName: 'Tiffany Mayo',
      assignedCleanerId: 'cleaner-1',
      branchId: 'branch-vt',
      status: 'IN_PROGRESS',
    });
    logAuditEntry.mockResolvedValue('audit-id');
  });

  it('persists a valid audit event with id, cleaner, job, and timestamp', async () => {
    const result = await escalateJobIssue(
      'job-1',
      'CLEANER_ISSUE',
      'CLEANER',
      'cleaner-1',
      'Gate code failed',
      'Tried both codes'
    );

    expect(result.success).toBe(true);
    expect(result.escalationId).toBeTruthy();
    expect(logAuditEntry).toHaveBeenCalledTimes(1);
    const params = logAuditEntry.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof params.id).toBe('string');
    expect((params.id as string).length).toBeGreaterThan(8);
    expect(params.entityType).toBe('Job');
    expect(params.entityId).toBe('job-1');
    expect(params.action).toBe('ESCALATION_CREATED');
    expect(params.actorId).toBe('cleaner-1');
    expect(params.actorRole).toBe('CLEANER');
    const changes = params.changes as Record<string, unknown>;
    expect(changes.jobId).toBe('job-1');
    expect(changes.cleanerId).toBe('cleaner-1');
    expect(changes.notes).toBe('Tried both codes');
    expect(typeof changes.createdAt).toBe('string');
  });

  it('still succeeds when audit logging fails', async () => {
    logAuditEntry.mockResolvedValue(null);

    const result = await escalateJobIssue(
      'job-1',
      'CLEANER_ISSUE',
      'CLEANER',
      'cleaner-1',
      'Gate code failed'
    );

    expect(result.success).toBe(true);
    expect(result.escalationId).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  it('still succeeds when audit logging throws', async () => {
    logAuditEntry.mockRejectedValue(new Error('Argument `id` is missing.'));

    const result = await escalateJobIssue(
      'job-1',
      'CLEANER_ISSUE',
      'CLEANER',
      'cleaner-1',
      'Gate code failed'
    );

    expect(result.success).toBe(true);
    expect(result.escalationId).toBeTruthy();
    expect(result.error).toBeUndefined();
  });
});
