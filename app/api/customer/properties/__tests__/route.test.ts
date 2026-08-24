/**
 * Host Property APIs — ownership, edit, Add Cleaning.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getCustomerSession = vi.fn();
const loadCustomerProperties = vi.fn();
const loadOwnedProperty = vi.fn();
const updateHostProperty = vi.fn();
const toHostPropertyView = vi.fn((p: { id: string }) => ({ ...p, view: true }));
const findManyJobs = vi.fn();
const findUniqueCustomer = vi.fn();
const findUniqueBranch = vi.fn();
const jobCreate = vi.fn();
const nextVmReference = vi.fn();
const awaitJobGoogleSync = vi.fn();

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => getCustomerSession(...a),
}));

vi.mock('@/lib/properties/propertyService', async () => {
  const actual = await vi.importActual<typeof import('@/lib/properties/propertyService')>(
    '@/lib/properties/propertyService'
  );
  return {
    ...actual,
    loadCustomerProperties: (...a: unknown[]) => loadCustomerProperties(...a),
    loadOwnedProperty: (...a: unknown[]) => loadOwnedProperty(...a),
    updateHostProperty: (...a: unknown[]) => updateHostProperty(...a),
    toHostPropertyView: (...a: unknown[]) => toHostPropertyView(...a),
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findMany: (...a: unknown[]) => findManyJobs(...a),
      create: (...a: unknown[]) => jobCreate(...a),
    },
    customer: {
      findUnique: (...a: unknown[]) => findUniqueCustomer(...a),
    },
    branch: {
      findUnique: (...a: unknown[]) => findUniqueBranch(...a),
    },
  },
}));

vi.mock('@/lib/billing/numbering', () => ({
  nextVmReference: (...a: unknown[]) => nextVmReference(...a),
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobGoogleSync: (...a: unknown[]) => awaitJobGoogleSync(...a),
}));

import { GET as listGET } from '@/app/api/customer/properties/route';
import {
  GET as detailGET,
  PATCH as detailPATCH,
} from '@/app/api/customer/properties/[propertyId]/route';
import { POST as cleaningsPOST } from '@/app/api/customer/properties/[propertyId]/cleanings/route';
import {
  buildPropertyDefaultsForJob,
  buildHostCleaningJobNotes,
  parseHostCleaningNotes,
} from '@/lib/properties/propertyService';
import type { Property } from '@prisma/client';

const CUST_A = 'cust-tiffany';
const CUST_B = 'cust-other';
const PROP_ID = 'cmsnpd4pk0001tiiwke8mejzq';

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: PROP_ID,
    customerId: CUST_A,
    name: "Lou Lou's Landing",
    address: '111 Thomson Drive',
    city: 'Ludlow',
    state: 'VT',
    postalCode: null,
    bedrooms: 2,
    bathrooms: 2,
    approximateSquareFeet: null,
    bedConfiguration: '2 queens',
    amenities: ['Washer'],
    restrictedAreas: null,
    accessType: 'Lockbox',
    accessNotes: 'SECRET-CODE',
    supplyStorageLocation: 'Hall',
    trashInstructions: 'Garage',
    linenInstructions: 'Host',
    standardCheckoutTime: '10:00 AM',
    standardCheckinTime: '4:00 PM',
    turnoverFrequency: null,
    sameDayTurnovers: null,
    standingInstructions: 'Flip beds',
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01'),
    ...overrides,
  };
}

describe('Host property APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toHostPropertyView.mockImplementation((p: Property) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      postalCode: p.postalCode,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      approximateSquareFeet: p.approximateSquareFeet,
      bedConfiguration: p.bedConfiguration,
      amenities: p.amenities,
      restrictedAreas: p.restrictedAreas,
      accessType: p.accessType,
      supplyStorageLocation: p.supplyStorageLocation,
      trashInstructions: p.trashInstructions,
      linenInstructions: p.linenInstructions,
      standardCheckoutTime: p.standardCheckoutTime,
      standardCheckinTime: p.standardCheckinTime,
      turnoverFrequency: p.turnoverFrequency,
      sameDayTurnovers: p.sameDayTurnovers,
      standingInstructions: p.standingInstructions,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  });

  it('lists own Properties when authenticated', async () => {
    getCustomerSession.mockResolvedValue({ customerId: CUST_A, email: 'a@x.com' });
    loadCustomerProperties.mockResolvedValue([makeProperty()]);
    const res = await listGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.properties).toHaveLength(1);
    expect(json.properties[0].name).toBe("Lou Lou's Landing");
    expect(json.properties[0].accessNotes).toBeUndefined();
  });

  it('rejects unauthenticated list', async () => {
    getCustomerSession.mockResolvedValue(null);
    const res = await listGET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when another Customer requests Property by ID (IDOR)', async () => {
    getCustomerSession.mockResolvedValue({ customerId: CUST_B, email: 'b@x.com' });
    loadOwnedProperty.mockResolvedValue(null);
    const res = await detailGET(new NextRequest('http://localhost/api'), {
      params: { propertyId: PROP_ID },
    });
    expect(res.status).toBe(404);
  });

  it('allows owner to PATCH standing fields', async () => {
    getCustomerSession.mockResolvedValue({ customerId: CUST_A, email: 'a@x.com' });
    const updated = makeProperty({ standingInstructions: 'New standing' });
    updateHostProperty.mockResolvedValue(updated);
    const res = await detailPATCH(
      new NextRequest('http://localhost/api', {
        method: 'PATCH',
        body: JSON.stringify({ standingInstructions: 'New standing' }),
      }),
      { params: { propertyId: PROP_ID } }
    );
    expect(res.status).toBe(200);
    expect(updateHostProperty).toHaveBeenCalledWith(
      expect.anything(),
      PROP_ID,
      CUST_A,
      expect.objectContaining({ standingInstructions: 'New standing' })
    );
  });

  it('rejects accessNotes in host PATCH', async () => {
    getCustomerSession.mockResolvedValue({ customerId: CUST_A, email: 'a@x.com' });
    const res = await detailPATCH(
      new NextRequest('http://localhost/api', {
        method: 'PATCH',
        body: JSON.stringify({ accessNotes: 'CODE' }),
      }),
      { params: { propertyId: PROP_ID } }
    );
    expect(res.status).toBe(400);
    expect(updateHostProperty).not.toHaveBeenCalled();
  });

  it('Add Cleaning uses Vermont customer branchId when present', async () => {
    getCustomerSession.mockResolvedValue({
      customerId: CUST_A,
      email: 'loulouslandingvt@gmail.com',
    });
    loadOwnedProperty.mockResolvedValue(makeProperty());
    findUniqueCustomer.mockResolvedValue({
      id: CUST_A,
      firstName: 'Tiffany',
      lastName: 'Mayo',
      branchId: 'branch-vt',
      Branch: { id: 'branch-vt', slug: 'vermont' },
    });
    nextVmReference.mockResolvedValue('VM-2026-0099');
    jobCreate.mockResolvedValue({
      id: 'job-new',
      jobReference: 'VM-2026-0099',
      propertyId: PROP_ID,
      address: '111 Thomson Drive',
      preferredDate: new Date('2026-09-01'),
      preferredTime: '12:00 - 16:00',
      serviceType: 'Vacation Rental Turnover',
      status: 'RECEIVED',
      branchId: 'branch-vt',
    });

    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-09-01',
          preferredTime: '12:00 - 16:00',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: true,
          checkInDeadline: '4:00 PM',
          jobSpecificNotes: 'Extra towels',
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.job.propertyId).toBe(PROP_ID);
    expect(json.job.address).toBe('111 Thomson Drive');
    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          address: '111 Thomson Drive',
          status: 'RECEIVED',
          paymentStatus: 'PENDING',
          Property: { connect: { id: PROP_ID } },
          Branch: { connect: { id: 'branch-vt' } },
          marketLabel: 'vermont',
        }),
      })
    );
    expect(awaitJobGoogleSync).toHaveBeenCalledWith('job-new');
    expect(findUniqueBranch).not.toHaveBeenCalled();
    const notesArg = jobCreate.mock.calls[0][0].data.internalNotes as string;
    expect(notesArg).toContain('[Source: HOST_PORTAL]');
    expect(notesArg).toContain('Same-day turnover: Yes');
    expect(notesArg).toContain('Check-in deadline: 4:00 PM');
  });

  it('Add Cleaning still returns success when Google sync rejects', async () => {
    getCustomerSession.mockResolvedValue({
      customerId: CUST_A,
      email: 'loulouslandingvt@gmail.com',
    });
    loadOwnedProperty.mockResolvedValue(makeProperty());
    findUniqueCustomer.mockResolvedValue({
      id: CUST_A,
      firstName: 'Tiffany',
      lastName: 'Mayo',
      branchId: 'branch-vt',
      Branch: { id: 'branch-vt', slug: 'vermont' },
    });
    nextVmReference.mockResolvedValue('VM-2026-0099');
    jobCreate.mockResolvedValue({
      id: 'job-new',
      jobReference: 'VM-2026-0099',
      propertyId: PROP_ID,
      address: '111 Thomson Drive',
      preferredDate: new Date('2026-09-15T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      serviceType: 'Vacation Rental Turnover',
      status: 'RECEIVED',
      branchId: 'branch-vt',
    });
    // Even if the helper unexpectedly rejected, route try/catch keeps Job success.
    awaitJobGoogleSync.mockRejectedValueOnce(new Error('Google down'));

    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-09-15',
          preferredTime: '10:00 AM',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
          jobSpecificNotes: 'PROPERTY PILOT TEST',
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.job.id).toBe('job-new');
    expect(awaitJobGoogleSync).toHaveBeenCalledWith('job-new');
    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferredDate: new Date('2026-09-15T00:00:00.000Z'),
        }),
      })
    );
  });

  it('Add Cleaning awaits Google sync before returning (not fire-and-forget)', async () => {
    const order: string[] = [];
    getCustomerSession.mockResolvedValue({
      customerId: CUST_A,
      email: 'loulouslandingvt@gmail.com',
    });
    loadOwnedProperty.mockResolvedValue(makeProperty());
    findUniqueCustomer.mockResolvedValue({
      id: CUST_A,
      firstName: 'Tiffany',
      lastName: 'Mayo',
      branchId: 'branch-vt',
      Branch: { id: 'branch-vt', slug: 'vermont' },
    });
    nextVmReference.mockResolvedValue('VM-2026-0099');
    jobCreate.mockImplementation(async () => {
      order.push('create');
      return {
        id: 'job-new',
        jobReference: 'VM-2026-0099',
        propertyId: PROP_ID,
        address: '111 Thomson Drive',
        preferredDate: new Date('2026-09-15T00:00:00.000Z'),
        preferredTime: '10:00 AM',
        serviceType: 'Vacation Rental Turnover',
        status: 'RECEIVED',
        branchId: 'branch-vt',
      };
    });
    awaitJobGoogleSync.mockImplementation(async () => {
      order.push('google');
    });

    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-09-15',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(200);
    expect(order).toEqual(['create', 'google']);
  });

  it('Add Cleaning uses another valid customer branch (not Vermont fallback)', async () => {
    getCustomerSession.mockResolvedValue({
      customerId: CUST_A,
      email: 'nj-host@example.com',
    });
    loadOwnedProperty.mockResolvedValue(makeProperty({ customerId: CUST_A }));
    findUniqueCustomer.mockResolvedValue({
      id: CUST_A,
      firstName: 'NJ',
      lastName: 'Host',
      branchId: 'branch-nj',
      Branch: { id: 'branch-nj', slug: 'new-jersey' },
    });
    nextVmReference.mockResolvedValue('VM-2026-0100');
    jobCreate.mockResolvedValue({
      id: 'job-nj',
      jobReference: 'VM-2026-0100',
      propertyId: PROP_ID,
      address: '111 Thomson Drive',
      preferredDate: new Date('2026-09-01'),
      preferredTime: null,
      serviceType: 'Vacation Rental Turnover',
      status: 'RECEIVED',
      branchId: 'branch-nj',
    });

    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-09-01',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(200);
    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          Branch: { connect: { id: 'branch-nj' } },
          marketLabel: 'new-jersey',
        }),
      })
    );
    expect(findUniqueBranch).not.toHaveBeenCalled();
  });

  it('Add Cleaning fails closed when customer has no resolvable branch', async () => {
    getCustomerSession.mockResolvedValue({
      customerId: CUST_A,
      email: 'orphan@example.com',
    });
    loadOwnedProperty.mockResolvedValue(makeProperty());
    findUniqueCustomer.mockResolvedValue({
      id: CUST_A,
      firstName: 'Orphan',
      lastName: 'Host',
      branchId: null,
      Branch: null,
    });

    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-09-01',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('BRANCH_NOT_CONFIGURED');
    expect(jobCreate).not.toHaveBeenCalled();
    expect(findUniqueBranch).not.toHaveBeenCalled();
    expect(awaitJobGoogleSync).not.toHaveBeenCalled();
  });

  it('Add Cleaning same-day=Yes without check-in deadline returns validation error', async () => {
    getCustomerSession.mockResolvedValue({
      customerId: CUST_A,
      email: 'loulouslandingvt@gmail.com',
    });
    loadOwnedProperty.mockResolvedValue(makeProperty());

    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-10-11',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: true,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('CHECK_IN_DEADLINE_REQUIRED');
    expect(jobCreate).not.toHaveBeenCalled();
    expect(awaitJobGoogleSync).not.toHaveBeenCalled();
  });

  it('Add Cleaning same-day=No succeeds without check-in deadline', async () => {
    getCustomerSession.mockResolvedValue({
      customerId: CUST_A,
      email: 'loulouslandingvt@gmail.com',
    });
    loadOwnedProperty.mockResolvedValue(makeProperty());
    findUniqueCustomer.mockResolvedValue({
      id: CUST_A,
      firstName: 'Tiffany',
      lastName: 'Mayo',
      branchId: 'branch-vt',
      Branch: { id: 'branch-vt', slug: 'vermont' },
    });
    nextVmReference.mockResolvedValue('VM-2026-0100');
    jobCreate.mockResolvedValue({
      id: 'job-no-same-day',
      jobReference: 'VM-2026-0100',
      propertyId: PROP_ID,
      address: '111 Thomson Drive',
      preferredDate: new Date('2026-10-11T00:00:00.000Z'),
      preferredTime: null,
      serviceType: 'Vacation Rental Turnover',
      status: 'RECEIVED',
      branchId: 'branch-vt',
    });

    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-10-11',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.job.propertyId).toBe(PROP_ID);
    expect(json.job.preferredDate).toBe('2026-10-11T00:00:00.000Z');
    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferredDate: new Date('2026-10-11T00:00:00.000Z'),
          address: '111 Thomson Drive',
          Property: { connect: { id: PROP_ID } },
          internalNotes: expect.stringContaining('[Source: HOST_PORTAL]'),
        }),
      })
    );
    const notesArg = jobCreate.mock.calls[0][0].data.internalNotes as string;
    expect(notesArg).toContain('Same-day turnover: No');
    expect(notesArg).not.toContain('Check-in deadline:');
    // Response must not claim Google success fields
    expect(json.job.driveFolderId).toBeUndefined();
    expect(json.job.calendarEventId).toBeUndefined();
    expect(json.googleSynced).toBeUndefined();
  });

  it('Add Cleaning returns 404 for non-owned Property', async () => {
    getCustomerSession.mockResolvedValue({ customerId: CUST_B, email: 'b@x.com' });
    loadOwnedProperty.mockResolvedValue(null);
    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-09-01',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );
    expect(res.status).toBe(404);
    expect(jobCreate).not.toHaveBeenCalled();
  });
});

describe('Property snapshot contract', () => {
  it('buildPropertyDefaultsForJob snapshots address independently of later Property edits', () => {
    const property = makeProperty();
    const defaults = buildPropertyDefaultsForJob(property);
    property.address = '999 Changed';
    expect(defaults.address).toBe('111 Thomson Drive');
    expect(defaults.propertyId).toBe(PROP_ID);
  });

  it('buildHostCleaningJobNotes keeps occurrence notes separate from standing instructions', () => {
    const notes = buildHostCleaningJobNotes({
      preferredDate: new Date('2026-09-01'),
      serviceType: 'Deep Cleaning & Property Reset',
      sameDayTurnover: false,
      jobSpecificNotes: 'Deep clean only',
    });
    expect(notes).toContain('[Source: HOST_PORTAL]');
    expect(notes).toContain('Deep clean only');
    expect(notes).not.toContain('Flip beds');
  });

  it('parseHostCleaningNotes resolves same-day + deadline for success banner', () => {
    const notes = buildHostCleaningJobNotes({
      preferredDate: new Date('2026-10-11'),
      serviceType: 'Vacation Rental Turnover',
      sameDayTurnover: true,
      checkInDeadline: '4:00 PM',
    });
    const parsed = parseHostCleaningNotes(notes);
    expect(parsed.sameDayTurnover).toBe(true);
    expect(parsed.checkInDeadline).toBe('4:00 PM');
    expect(parseHostCleaningNotes('Same-day turnover: No').sameDayTurnover).toBe(
      false
    );
  });

  it('success banner job resolution matches created id from upcomingJobs', () => {
    const upcomingJobs = [
      { id: 'job-a', preferredDate: '2026-10-11T00:00:00.000Z' },
      { id: 'job-created', preferredDate: '2026-10-11T00:00:00.000Z' },
    ];
    const createdJobId = 'job-created';
    const createdJob = upcomingJobs.find((j) => j.id === createdJobId) ?? null;
    expect(createdJob?.id).toBe('job-created');
    expect(createdJob?.preferredDate).toBe('2026-10-11T00:00:00.000Z');
  });
});
