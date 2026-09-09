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
          compensationBasis: 'FLAT',
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
    expect(json.job.operationalTotal).toBeUndefined();
    expect(json.job.paymentStatus).toBeUndefined();
    expect(json.job.compensationAmount).toBe(195);
    expect(json.job.compensation).toEqual({
      amount: 195,
      currency: 'USD',
      basis: 'FLAT',
      basisLabel: 'Flat rate',
    });
    const assignedBlob = JSON.stringify(json);
    expect(assignedBlob).not.toMatch(/quotedTotal|totalPrice|operationalTotal|337\.8|platformFee/);
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
          compensationBasis: 'FLAT',
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
    expect(json.offer.compensation).toEqual({
      amount: 195,
      currency: 'USD',
      basis: 'FLAT',
      basisLabel: 'Flat rate',
    });
    expect(json.offer.serviceType).toBe('Vacation Rental Turnover');
    expect(json.offer.estimatedDurationMins).toBe(180);
    expect(json.offer.preferredTime).toBe('11:00 AM');
    const blob = JSON.stringify(json);
    expect(blob).not.toContain('LOCKBOX-9999');
    expect(blob).not.toContain('111 Thomson Drive');
    expect(blob).not.toMatch(/quotedTotal|totalPrice|operationalTotal|337|platformFee|paymentStatus/);
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

  it('returns 403 when a live offer exists for User.id but the session cookie is a phone-login hash', async () => {
    requireRole.mockResolvedValue({
      userId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      role: 'CLEANER',
    });
    findUnique.mockResolvedValue({
      id: JOB_ID,
      status: 'RECEIVED',
      assignedCleanerId: null,
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
    expect(json.error).toMatch(/not assigned/i);
  });

  it('returns Expired access for the offer owner when the offer is past expiresAt', async () => {
    findUnique.mockResolvedValue({
      id: JOB_ID,
      status: 'RECEIVED',
      assignedCleanerId: null,
      Property: propertyRow(),
      propertyId: 'prop-1',
      Branch: { id: 'branch-vt', name: 'Vermont' },
      Customer: null,
      preferredDate: new Date('2026-09-09T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      assignedAt: null,
      onTheWayAt: null,
      startedAt: null,
      completedAt: null,
      JobOffer: [
        {
          id: 'offer-stale',
          jobId: JOB_ID,
          cleanerId: CLEANER_ID,
          status: 'OFFERED',
          compensationAmount: 172.25,
          compensationCurrency: 'USD',
          compensationBasis: 'FLAT',
          estimatedDurationMins: 180,
          operationalNotes: 'Garage code 9999',
          expiresAt: new Date('2020-01-01T00:00:00.000Z'),
          offeredAt: new Date(),
        },
      ],
      jobReference: 'VM-LIVE-1',
      serviceType: 'Vacation Rental Turnover',
      serviceLocation: 'Ludlow',
      internalNotes: null,
    });

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.access).toBe('EXPIRED');
    expect(json.offer.status).toBe('EXPIRED');
    expect(json.job.property).toBeUndefined();
    expect(json.job.address).toBeUndefined();
    expect(JSON.stringify(json)).not.toMatch(/LOCKBOX-9999|Garage code 9999|111 Thomson/);
  });

  it('returns RELEASED access without property credentials after assignment release', async () => {
    findUnique.mockResolvedValue({
      id: JOB_ID,
      status: 'CONFIRMED',
      assignedCleanerId: null,
      Property: propertyRow(),
      propertyId: 'prop-1',
      Branch: { id: 'branch-vt', name: 'Vermont' },
      Customer: { id: 'cust-1', firstName: 'Tiffany', lastName: 'Mayo', email: 't@example.com', phone: null },
      preferredDate: new Date('2026-10-04T00:00:00.000Z'),
      preferredTime: 'anytime after 11',
      assignedAt: null,
      onTheWayAt: null,
      startedAt: null,
      completedAt: null,
      JobOffer: [
        {
          id: 'offer-accepted-1',
          jobId: JOB_ID,
          cleanerId: CLEANER_ID,
          status: 'ACCEPTED',
          compensationAmount: 172.25,
          compensationCurrency: 'USD',
          compensationBasis: 'FLAT',
          estimatedDurationMins: 180,
          operationalNotes: 'Garage code 9999',
          expiresAt: new Date('2026-09-08T16:02:42.691Z'),
          offeredAt: new Date('2026-09-08T14:02:42.691Z'),
        },
      ],
      jobReference: 'VM-2026-0028',
      serviceType: 'Vacation Rental Turnover',
      serviceLocation: 'Ludlow',
      internalNotes: null,
    });

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.access).toBe('RELEASED');
    expect(json.offer.status).toBe('ACCEPTED');
    expect(json.job.property).toBeUndefined();
    expect(json.job.address).toBeUndefined();
    expect(JSON.stringify(json)).not.toMatch(/LOCKBOX-9999|Garage code 9999|111 Thomson/);
  });

  it('returns 403 OFFER_NOT_YOURS when another cleaner opens the expired offer job', async () => {
    requireRole.mockResolvedValue({ userId: 'other-cleaner', role: 'CLEANER' });
    findUnique.mockResolvedValue({
      id: JOB_ID,
      status: 'RECEIVED',
      assignedCleanerId: null,
      Property: propertyRow(),
      propertyId: 'prop-1',
      Branch: { id: 'branch-vt', name: 'Vermont' },
      Customer: null,
      preferredDate: new Date('2026-09-09T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      assignedAt: null,
      onTheWayAt: null,
      startedAt: null,
      completedAt: null,
      JobOffer: [],
      jobReference: 'VM-LIVE-1',
      serviceType: 'Vacation Rental Turnover',
      serviceLocation: 'Ludlow',
      internalNotes: null,
    });

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs/' + JOB_ID), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('OFFER_NOT_YOURS');
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
