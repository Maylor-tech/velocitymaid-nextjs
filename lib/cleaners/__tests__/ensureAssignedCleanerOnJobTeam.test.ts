import { beforeEach, describe, expect, it, vi } from 'vitest';

const jobFindUnique = vi.fn();
const teamCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    jobTeamMember: { create: (...a: unknown[]) => teamCreate(...a) },
  },
}));

import { ensureAssignedCleanerOnJobTeam } from '../ensureAssignedCleanerOnJobTeam';

describe('ensureAssignedCleanerOnJobTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a team row when the assigned cleaner is missing from Job Team', async () => {
    jobFindUnique.mockResolvedValue({
      assignedCleanerId: 'brian',
      JobTeamMember: [],
    });
    teamCreate.mockResolvedValue({ id: 'tm1' });

    const result = await ensureAssignedCleanerOnJobTeam('job-1');
    expect(result).toEqual({ synced: true, reason: 'CREATED', cleanerId: 'brian' });
    expect(teamCreate).toHaveBeenCalledWith({
      data: { jobId: 'job-1', cleanerId: 'brian', sortOrder: 0 },
    });
  });

  it('does not duplicate an existing team row', async () => {
    jobFindUnique.mockResolvedValue({
      assignedCleanerId: 'brian',
      JobTeamMember: [{ cleanerId: 'brian' }],
    });

    const result = await ensureAssignedCleanerOnJobTeam('job-1');
    expect(result).toEqual({
      synced: false,
      reason: 'ALREADY_ON_TEAM',
      cleanerId: 'brian',
    });
    expect(teamCreate).not.toHaveBeenCalled();
  });
});
