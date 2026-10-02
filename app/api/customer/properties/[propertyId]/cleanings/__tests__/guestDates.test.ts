/**
 * Add Cleaning — preferredDate (service date) and guest stay dates stay
 * independent, and an invoice-after-service request lands RECEIVED / PENDING.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getCustomerSession = vi.fn();
const loadOwnedProperty = vi.fn();
const findUniqueCustomer = vi.fn();
const jobCreate = vi.fn();
const nextVmReference = vi.fn();
const awaitJobGoogleSync = vi.fn();
const notifyHostCleaningRequestCreated = vi.fn();

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => getCustomerSession(...a),
}));

vi.mock('@/lib/properties/propertyService', async () => {
  const actual = await vi.importActual<typeof import('@/lib/properties/propertyService')>(
    '@/lib/properties/propertyService'
  );
  return { ...actual, loadOwnedProperty: (...a: unknown[]) => loadOwnedProperty(...a) };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { create: (...a: unknown[]) => jobCreate(...a) },
    customer: { findUnique: (...a: unknown[]) => findUniqueCustomer(...a) },
    branch: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/billing/numbering', () => ({
  nextVmReference: (...a: unknown[]) => nextVmReference(...a),
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobGoogleSync: (...a: unknown[]) => awaitJobGoogleSync(...a),
}));

vi.mock('@/lib/notifications/hostCleaningRequestNotify', () => ({
  notifyHostCleaningRequestCreated: (...a: unknown[]) =>
    notifyHostCleaningRequestCreated(...a),
}));

import { POST as cleaningsPOST } from '@/app/api/customer/properties/[propertyId]/cleanings/route';

const PROP_ID = 'prop-1';

function makeProperty() {
  return {
    id: PROP_ID,
    customerId: 'cust-1',
    name: 'Bear Hill',
    address: '1 Bear Hill Rd',
    city: 'Ludlow',
    state: 'VT',
    postalCode: null,
    bedrooms: 2,
    bathrooms: 1,
    billingPolicy: null,
    standingInstructions: 'Flip beds',
    accessType: 'Lockbox',
    accessNotes: 'secret',
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01'),
  };
}

describe('Add Cleaning — date independence + RECEIVED/PENDING', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifyHostCleaningRequestCreated.mockResolvedValue({
      opsAlert: { type: 'HOST_CLEANING_REQUEST', ok: true, created: true, id: 'n1' },
      email: { sent: true, skipped: false, provider: 'RESEND', messageId: 're_1' },
    });
    getCustomerSession.mockResolvedValue({ customerId: 'cust-1', email: 'host@x.com' });
    loadOwnedProperty.mockResolvedValue(makeProperty());
    findUniqueCustomer.mockResolvedValue({
      id: 'cust-1',
      firstName: 'Host',
      lastName: 'User',
      email: 'host@x.com',
      branchId: 'branch-vt',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      Branch: { id: 'branch-vt', slug: 'vermont' },
    });
    nextVmReference.mockResolvedValue('VM-2026-0200');
    jobCreate.mockResolvedValue({
      id: 'job-1',
      jobReference: 'VM-2026-0200',
      propertyId: PROP_ID,
      address: '1 Bear Hill Rd',
      preferredDate: new Date('2026-12-12T00:00:00.000Z'),
      preferredTime: null,
      guestCheckInDate: new Date('2026-12-12T00:00:00.000Z'),
      guestCheckOutDate: new Date('2026-12-11T00:00:00.000Z'),
      serviceType: 'Vacation Rental Turnover',
      status: 'RECEIVED',
      paymentStatus: 'PENDING',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      branchId: 'branch-vt',
    });
  });

  it('maps preferredDate, guestCheckOutDate, guestCheckInDate to three distinct Job fields', async () => {
    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-12-12',
          guestCheckOutDate: '2026-12-11',
          guestCheckInDate: '2026-12-12',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(200);
    const data = jobCreate.mock.calls[0][0].data;

    // Service / turnover date is its own field, independent of either stay date.
    expect((data.preferredDate as Date).toISOString().slice(0, 10)).toBe('2026-12-12');
    expect((data.guestCheckOutDate as Date).toISOString().slice(0, 10)).toBe('2026-12-11');
    expect((data.guestCheckInDate as Date).toISOString().slice(0, 10)).toBe('2026-12-12');

    // No date is derived from or overwritten by another.
    expect(data.preferredDate).not.toBe(data.guestCheckOutDate);
    expect(data.preferredDate).not.toBe(data.guestCheckInDate);
  });

  it('an invoice-after-service request lands RECEIVED / PENDING and still succeeds', async () => {
    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-12-12',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'RECEIVED',
          paymentStatus: 'PENDING',
          billingPolicy: 'INVOICE_AFTER_SERVICE',
        }),
      })
    );
  });

  it('a cleaning with no guest stay dates still succeeds (dates are optional/independent)', async () => {
    jobCreate.mockResolvedValueOnce({
      id: 'job-2',
      jobReference: 'VM-2026-0201',
      propertyId: PROP_ID,
      address: '1 Bear Hill Rd',
      preferredDate: new Date('2026-12-12T00:00:00.000Z'),
      preferredTime: null,
      guestCheckInDate: null,
      guestCheckOutDate: null,
      serviceType: 'Vacation Rental Turnover',
      status: 'RECEIVED',
      paymentStatus: 'PENDING',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      branchId: 'branch-vt',
    });
    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-12-12',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: PROP_ID } }
    );
    expect(res.status).toBe(200);
    const data = jobCreate.mock.calls[0][0].data;
    expect(data.guestCheckInDate).toBeNull();
    expect(data.guestCheckOutDate).toBeNull();
    expect((data.preferredDate as Date).toISOString().slice(0, 10)).toBe('2026-12-12');
  });
});
