/**
 * Cleaner job detail — Property instructions only for assigned cleaner.
 * Offer view withholds access credentials and customer invoice totals.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const findUnique = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
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
    billingPolicy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('GET /api/cleaner/jobs/[jobId] property instructions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: CLEANER_ID, role: 'CLEANER' });
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
      currency: 'USD',
      assignedAt: new Date(),
      assignedCleanerId: CLEANER_ID,
      onTheWayAt: null,
      startedAt: null,
      completedAt: null,
      cleanDurationMins: null,
      estimatedDurationMins: null,
      internalNotes: 'Deep clean only — no turnover',
      propertyId: 'prop-1',
      jobReference: 'VM-TEST-1',
      Branch: { id: 'branch-vt', name: 'Vermont' },
      Customer: {
        id: 'cust-1',
        firstName: 'Tiffany',
        lastName: 'Mayo',
        email: 'loulouslandingvt@gmail.com',
        phone: '2039549764',
      },
      Property: propertyRow(),
      JobOffer: [
        {
          id: 'offer-1',
          jobId: JOB_ID,
          cleanerId: CLEANER_ID,
          status: 'ACCEPTED',
          compensationAmount: 195,
          compensationCurrency: 'USD',
          estimatedDurationMins: 180,
          operationalNotes: null,
          expiresAt: new Date('2099-01-01'),
          offeredAt: new Date(),
        },
      ],
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
    expect(json.job.totalPrice).toBeUndefined();
    expect(json.job.quotedTotal).toBeUndefined();
    expect(json.job.compensationAmount).toBe(195);
  });

  it('withholds access credentials on an unaccepted offer', async () => {
    findUnique.mockResolvedValue({
      id: JOB_ID,
      status: 'RECEIVED',
      paymentStatus: 'PENDING',
      customerName: 'Tiffany Mayo',
      serviceType: 'Vacation Rental Turnover',
      serviceLocation: 'Ludlow',
      preferredDate: new Date('2026-09-15T00:00:00.000Z'),
      preferredTime: '11:00 AM',
      address: '111 Thomson Drive',
      currency: 'USD',
      assignedAt: null,
      assignedCleanerId: null,
      onTheWayAt: null,
      startedAt: null,
      completedAt: null,
      cleanDurationMins: null,
      estimatedDurationMins: 180,
      internalNotes: 'Gate code in property notes',
      propertyId: 'prop-1',
      jobReference: 'VM-TEST-1',
      Branch: { id: 'branch-vt', name: 'Vermont' },
      Customer: {
        id: 'cust-1',
        firstName: 'Tiffany',
        lastName: 'Mayo',
        email: 'loulouslandingvt@gmail.com',
        phone: '2039549764',
      },
      Property: propertyRow(),
      JobOffer: [
        {
          id: 'offer-open',
          jobId: JOB_ID,
          cleanerId: CLEANER_ID,
          status: 'OFFERED',
          compensationAmount: 195,
          compensationCurrency: 'USD',
          estimatedDurationMins: 180,
          operationalNotes: 'Bring extra towels',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          offeredAt: new Date(),
        },
      ],
    });

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.access).toBe('OFFER');
    expect(json.job.property).toBeUndefined();
    expect(json.offer.location.areaLabel).toBe('Ludlow');
    const blob = JSON.stringify(json);
    expect(blob).not.toContain('LOCKBOX-9999');
    expect(blob).not.toContain('111 Thomson Drive');
    expect(blob).not.toMatch(/quotedTotal|totalPrice|337/);
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
      currency: 'USD',
      assignedAt: null,
      assignedCleanerId: CLEANER_ID,
      onTheWayAt: null,
      startedAt: null,
      completedAt: null,
      cleanDurationMins: null,
      estimatedDurationMins: null,
      internalNotes: null,
      propertyId: null,
      jobReference: null,
      Branch: null,
      Customer: null,
      Property: null,
      JobOffer: [],
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
      startedAt: null,
      completedAt: null,
      JobOffer: [],
      jobReference: null,
      serviceType: null,
      preferredTime: null,
      serviceLocation: null,
      internalNotes: null,
    });

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.job).toBeUndefined();
  });

  it('blocks unauthorized cleaner before job load when requireRole rejects', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
