/**
 * Cleaner job detail — Property instructions only for assigned cleaner.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireCleanerJobAssignment = vi.fn();
const findUnique = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireCleanerJobAssignment: (...args: unknown[]) =>
    requireCleanerJobAssignment(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));

vi.mock('@/lib/api/routeAuth', () => ({
  rethrowIfAuthResponse: (error: unknown) =>
    error instanceof NextResponse ? error : null,
}));

import { GET } from '@/app/api/cleaner/jobs/[jobId]/route';

const JOB_ID = 'job-lou-1';
const CLEANER_ID = 'cleaner-brian';

function propertyRow() {
  return {
    id: 'prop-1',
    customerId: 'cust-1',
    name: "Lou Lou's Landing",
    address: '111 Thomson Drive',
    city: 'Ludlow',
    state: 'VT',
    postalCode: null,
    bedrooms: 2,
    bathrooms: 2,
    approximateSquareFeet: 1400,
    bedConfiguration: '2 queens',
    amenities: ['Washer/Dryer'],
    restrictedAreas: 'Owner closet',
    accessType: 'Lockbox',
    accessNotes: 'LOCKBOX-9999',
    supplyStorageLocation: 'Hall closet',
    trashInstructions: 'Garage',
    linenInstructions: 'Host provides',
    standardCheckoutTime: '10:00 AM',
    standardCheckinTime: '4:00 PM',
    turnoverFrequency: 'Weekly',
    sameDayTurnovers: 'Sometimes',
    standingInstructions: 'Flip all beds',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('GET /api/cleaner/jobs/[jobId] property instructions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCleanerJobAssignment.mockResolvedValue({ userId: CLEANER_ID });
  });

  it('returns Property standing info + job-specific notes for assigned cleaner', async () => {
    findUnique.mockResolvedValue({
      id: JOB_ID,
      status: 'ASSIGNED',
      paymentStatus: 'PENDING',
      customerName: 'Tiffany Mayo',
      serviceType: 'Deep Cleaning & Property Reset',
      serviceLocation: 'Ludlow',
      preferredDate: new Date('2026-08-12'),
      preferredTime: '12:00 - 16:00',
      address: '111 Thomson Drive',
      totalPrice: 350,
      currency: 'USD',
      assignedAt: new Date(),
      assignedCleanerId: CLEANER_ID,
      onTheWayAt: null,
      completedAt: null,
      internalNotes: 'Deep clean only — no turnover',
      propertyId: 'prop-1',
      Branch: { id: 'branch-vt', name: 'Vermont' },
      Customer: {
        id: 'cust-1',
        firstName: 'Tiffany',
        lastName: 'Mayo',
        email: 'loulouslandingvt@gmail.com',
        phone: '2039549764',
      },
      Property: propertyRow(),
    });

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.job.property.name).toBe("Lou Lou's Landing");
    expect(json.job.property.standingInstructions).toBe('Flip all beds');
    expect(json.job.property.accessNotes).toBe('LOCKBOX-9999');
    expect(json.job.jobSpecificNotes).toBe('Deep clean only — no turnover');
    expect(json.job.address).toBe('111 Thomson Drive');
  });

  it('works when Job has no propertyId', async () => {
    findUnique.mockResolvedValue({
      id: JOB_ID,
      status: 'ASSIGNED',
      paymentStatus: 'PENDING',
      customerName: 'Guest',
      serviceType: 'basic',
      serviceLocation: null,
      preferredDate: null,
      preferredTime: null,
      address: '9 Depot St',
      totalPrice: null,
      currency: 'USD',
      assignedAt: null,
      assignedCleanerId: CLEANER_ID,
      onTheWayAt: null,
      completedAt: null,
      internalNotes: null,
      propertyId: null,
      Branch: null,
      Customer: null,
      Property: null,
    });

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.job.property).toBeNull();
  });

  it('denies Property when cleaner is not the assigned cleaner', async () => {
    findUnique.mockResolvedValue({
      id: JOB_ID,
      assignedCleanerId: 'someone-else',
      Property: propertyRow(),
      propertyId: 'prop-1',
      Branch: null,
      Customer: null,
      preferredDate: null,
      assignedAt: null,
      onTheWayAt: null,
      completedAt: null,
      totalPrice: null,
      internalNotes: null,
    });

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.job).toBeUndefined();
  });

  it('blocks unauthorized cleaner before job load when requireCleaner rejects', async () => {
    requireCleanerJobAssignment.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
