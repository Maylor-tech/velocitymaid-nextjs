/**
 * Winter acceptance — Vermont host (invoice-after-service) vs PREPAY.
 * Mocked end-to-end of the commercial rules, not Calendar sync.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { isJobAssignable } from '@/lib/billing/billingPolicy';
import { formatConfirmedSchedule } from '@/lib/dates/serviceDate';
import { customerJobListWhere } from '@/lib/customer/customerJobList';

const getCustomerSession = vi.fn();
const loadOwnedProperty = vi.fn();
const findUniqueCustomer = vi.fn();
const jobCreate = vi.fn();
const nextVmReference = vi.fn();
const awaitJobGoogleSync = vi.fn();
const sendHostRequestReceivedEmail = vi.fn(async () => ({ sent: true }));
const createAdminNotification = vi.fn(async () => undefined);

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => getCustomerSession(...a),
}));

vi.mock('@/lib/properties/propertyService', async () => {
  const actual = await vi.importActual<typeof import('@/lib/properties/propertyService')>(
    '@/lib/properties/propertyService'
  );
  return {
    ...actual,
    loadOwnedProperty: (...a: unknown[]) => loadOwnedProperty(...a),
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { create: (...a: unknown[]) => jobCreate(...a) },
    customer: { findUnique: (...a: unknown[]) => findUniqueCustomer(...a) },
  },
}));

vi.mock('@/lib/billing/numbering', () => ({
  nextVmReference: (...a: unknown[]) => nextVmReference(...a),
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobGoogleSync: (...a: unknown[]) => awaitJobGoogleSync(...a),
}));

vi.mock('@/lib/email/sendHostRequestReceivedEmail', () => ({
  sendHostRequestReceivedEmail: (...a: unknown[]) => sendHostRequestReceivedEmail(...a),
}));

vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: (...a: unknown[]) => createAdminNotification(...a),
  adminNotificationHelpers: {
    adminJobLink: (id: string) => `https://velocitymaid.com/admin/jobs/${id}`,
  },
}));

import { POST as cleaningsPOST } from '@/app/api/customer/properties/[propertyId]/cleanings/route';

const CHIPMAN_PROP = 'prop-198-chipman';
const RAY_ID = 'cust-ray';

const chipmanProperty = {
  id: CHIPMAN_PROP,
  customerId: RAY_ID,
  name: '198 Chipman Park',
  address: '198 Chipman Park',
  city: 'Middlebury',
  state: 'VT',
  postalCode: null,
  bedrooms: 3,
  bathrooms: 2,
  approximateSquareFeet: null,
  bedConfiguration: null,
  amenities: [],
  restrictedAreas: null,
  accessType: 'Lockbox',
  accessNotes: null,
  supplyStorageLocation: null,
  trashInstructions: null,
  linenInstructions: null,
  standardCheckoutTime: '10:00 AM',
  standardCheckinTime: '4:00 PM',
  turnoverFrequency: null,
  sameDayTurnovers: null,
  standingInstructions: null,
  billingPolicy: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('Vermont host winter journey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCustomerSession.mockResolvedValue({
      customerId: RAY_ID,
      email: 'hautchamp26@gmail.com',
    });
    loadOwnedProperty.mockResolvedValue(chipmanProperty);
    findUniqueCustomer.mockResolvedValue({
      id: RAY_ID,
      firstName: 'Ray',
      lastName: 'Hautchamp',
      email: 'hautchamp26@gmail.com',
      branchId: 'branch-vt',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      Branch: { id: 'branch-vt', slug: 'vermont' },
    });
    nextVmReference.mockResolvedValue('VM-2026-WINTER');
    jobCreate.mockResolvedValue({
      id: 'job-aug-30',
      jobReference: 'VM-2026-WINTER',
      propertyId: CHIPMAN_PROP,
      address: '198 Chipman Park',
      preferredDate: new Date('2026-08-30T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      serviceType: 'Vacation Rental Turnover',
      status: 'RECEIVED',
      paymentStatus: 'PENDING',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      branchId: 'branch-vt',
    });
    awaitJobGoogleSync.mockResolvedValue(undefined);
  });

  it('creates RECEIVED / PENDING / INVOICE_AFTER_SERVICE, emails the host, and alerts ops', async () => {
    const res = await cleaningsPOST(
      new NextRequest('http://localhost/api', {
        method: 'POST',
        body: JSON.stringify({
          preferredDate: '2026-08-30',
          preferredTime: '10:00 AM',
          serviceType: 'Vacation Rental Turnover',
          sameDayTurnover: false,
        }),
      }),
      { params: { propertyId: CHIPMAN_PROP } }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.job.status).toBe('RECEIVED');
    expect(json.job.paymentStatus).toBe('PENDING');
    expect(json.job.billingPolicy).toBe('INVOICE_AFTER_SERVICE');

    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'RECEIVED',
          paymentStatus: 'PENDING',
          billingPolicy: 'INVOICE_AFTER_SERVICE',
        }),
      })
    );

    expect(customerJobListWhere(RAY_ID, 'upcoming')).not.toHaveProperty(
      'paymentStatus'
    );

    expect(sendHostRequestReceivedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'hautchamp26@gmail.com',
        preferredTime: '10:00 AM',
        jobId: 'job-aug-30',
      })
    );
    const emailArg = sendHostRequestReceivedEmail.mock.calls[0][0];
    expect(emailArg.preferredDate.toISOString()).toBe(
      '2026-08-30T00:00:00.000Z'
    );

    expect(createAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HOST_CLEANING_REQUEST',
        jobId: 'job-aug-30',
      })
    );
  });

  it('lets ops assign a cleaner without flipping payment to PAID', () => {
    const created = {
      paymentStatus: 'PENDING' as const,
      reviewStatus: 'PENDING' as const,
      billingPolicy: 'INVOICE_AFTER_SERVICE' as const,
    };
    expect(isJobAssignable(created)).toBe(true);
    expect(created.paymentStatus).toBe('PENDING');
  });

  it('notifies the host with the actual confirmed date and time', () => {
    const schedule = formatConfirmedSchedule(
      '2026-08-30T00:00:00.000Z',
      '10:00 AM'
    );
    expect(schedule.dateLabel).toBe('Sunday, August 30, 2026');
    expect(schedule.timeLabel).toBe('10:00 AM');
    expect(schedule.combined).toBe('Sunday, August 30, 2026 at 10:00 AM');
    expect(schedule.dateLabel).not.toMatch(/August 29/);
  });
});

describe('PREPAY winter control', () => {
  it('blocks assignment until payment clears and does not treat PENDING as paid', () => {
    expect(
      isJobAssignable({
        paymentStatus: 'PENDING',
        reviewStatus: 'PENDING',
        billingPolicy: 'PREPAY',
      })
    ).toBe(false);
    expect(
      isJobAssignable({
        paymentStatus: 'PAID',
        billingPolicy: 'PREPAY',
      })
    ).toBe(true);
  });
});
