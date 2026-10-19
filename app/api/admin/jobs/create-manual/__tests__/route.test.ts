import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TINA_CUSTOMER_ID = '1233f6e1-5463-4a19-a35f-fbca5fe54725';
const TINA_PROPERTY_ID = 'cmuoajao80003ku0447slewk1';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  customerFindUnique: vi.fn(),
  customerCreate: vi.fn(),
  customerUpdate: vi.fn(),
  propertyFindUnique: vi.fn(),
  propertyUpdate: vi.fn(),
  propertyCreate: vi.fn(),
  branchFindUnique: vi.fn(),
  jobFindMany: vi.fn(),
  jobCreate: vi.fn(),
  packageFindMany: vi.fn(),
  packageUpdate: vi.fn(),
  rateUpdate: vi.fn(),
  preferenceFindUnique: vi.fn(),
  protectOperationalPrice: vi.fn(),
  loadProcessingPolicy: vi.fn(),
  nextVmReference: vi.fn(),
  awaitJobGoogleSync: vi.fn(),
  geocodeCustomerInBackground: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => mocks.requireRole(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findUnique: mocks.customerFindUnique,
      create: mocks.customerCreate,
      update: mocks.customerUpdate,
    },
    property: {
      findUnique: mocks.propertyFindUnique,
      update: mocks.propertyUpdate,
      create: mocks.propertyCreate,
    },
    branch: { findUnique: mocks.branchFindUnique },
    job: {
      findMany: mocks.jobFindMany,
      create: mocks.jobCreate,
    },
    propertyServicePackage: {
      findMany: mocks.packageFindMany,
      update: mocks.packageUpdate,
    },
    propertyServiceRate: {
      update: mocks.rateUpdate,
    },
    propertyPaymentPreference: {
      findUnique: mocks.preferenceFindUnique,
    },
  },
}));

vi.mock('@/lib/pricing/processingPolicy', () => ({
  protectOperationalPrice: (...args: unknown[]) => mocks.protectOperationalPrice(...args),
  loadProcessingPolicy: (...args: unknown[]) => mocks.loadProcessingPolicy(...args),
}));

vi.mock('@/lib/billing/numbering', () => ({
  nextVmReference: () => mocks.nextVmReference(),
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobGoogleSync: (...args: unknown[]) => mocks.awaitJobGoogleSync(...args),
}));

vi.mock('@/lib/geocoding/geocodeCustomer', () => ({
  geocodeCustomerInBackground: (...args: unknown[]) => mocks.geocodeCustomerInBackground(...args),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...args: unknown[]) => mocks.logAuditEntry(...args),
}));

import { GET, POST } from '../route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/jobs/create-manual', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function tinaBody(overrides: Record<string, unknown> = {}) {
  return {
    customerMode: 'existing',
    customerId: TINA_CUSTOMER_ID,
    propertyId: TINA_PROPERTY_ID,
    clientFirstName: 'Tina',
    clientLastName: 'Martin',
    clientEmail: 'tmrmar01@aol.com',
    propertyAddress: '18 Snow Trak North',
    propertyCity: 'Ludlow',
    propertyState: 'VT',
    branch: 'new-jersey',
    serviceCategory: 'VACATION_RENTAL',
    serviceType: 'Vacation Rental Turnover',
    scheduledDate: '2026-11-02',
    scheduledStartTime: '10:00',
    scheduledEndTime: '13:00',
    guestCheckInDate: '2026-11-01',
    guestCheckOutDate: '2026-11-08',
    priceInputMode: 'operational',
    totalAmount: 200,
    paymentStatus: 'PENDING',
    jobStatus: 'RECEIVED',
    cleanerName: 'Should Not Assign',
    ...overrides,
  };
}

describe('POST /api/admin/jobs/create-manual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', branchId: null });
    mocks.nextVmReference.mockResolvedValue('VM-TEST-0001');
    mocks.awaitJobGoogleSync.mockResolvedValue(undefined);
    mocks.logAuditEntry.mockResolvedValue('audit-1');
    mocks.jobFindMany.mockResolvedValue([]);
    mocks.packageFindMany.mockResolvedValue([]);
    mocks.preferenceFindUnique.mockResolvedValue(null);
    mocks.jobCreate.mockImplementation(async ({ data }: { data: { Property?: { connect: { id: string } } } }) => ({
      id: 'job-new',
      propertyId: data.Property?.connect.id ?? null,
    }));
    mocks.customerFindUnique.mockImplementation(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id === TINA_CUSTOMER_ID) {
        return {
          id: TINA_CUSTOMER_ID,
          firstName: 'Tina',
          lastName: 'Martin',
          email: 'tmrmar01@aol.com',
          billingPolicy: 'INVOICE_AFTER_SERVICE',
          branchId: 'branch-vt',
          Branch: { id: 'branch-vt', state: 'VT', slug: 'vermont' },
        };
      }
      return null;
    });
    mocks.propertyFindUnique.mockResolvedValue({
      id: TINA_PROPERTY_ID,
      customerId: TINA_CUSTOMER_ID,
      billingPolicy: null,
      bathrooms: 2.5,
      ResidentialProfile: null,
    });
    mocks.protectOperationalPrice.mockResolvedValue({
      protected: false,
      customerPrice: 200,
      operationalSubtotal: 200,
      processingAllowanceEstimated: 0,
      pricingPolicyVersion: null,
      warning: 'Processing protection is disabled',
    });
  });

  it('links Tina’s existing customer and property, stays Received, and does not write profiles', async () => {
    const res = await POST(request(tinaBody()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.customerId).toBe(TINA_CUSTOMER_ID);
    expect(json.propertyId).toBe(TINA_PROPERTY_ID);
    expect(json.status).toBe('RECEIVED');
    expect(mocks.customerCreate).not.toHaveBeenCalled();
    expect(mocks.customerUpdate).not.toHaveBeenCalled();
    expect(mocks.propertyCreate).not.toHaveBeenCalled();
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
    expect(mocks.geocodeCustomerInBackground).not.toHaveBeenCalled();

    const created = mocks.jobCreate.mock.calls[0][0].data;
    expect(created.customerName).toBe('Tina Martin');
    expect(created.Customer.connect.id).toBe(TINA_CUSTOMER_ID);
    expect(created.Property.connect.id).toBe(TINA_PROPERTY_ID);
    expect(created.Branch.connect.id).toBe('branch-vt');
    expect(created.marketLabel).toBe('vermont');
    expect(created.status).toBe('RECEIVED');
    expect(created.assignedCleanerId).toBeUndefined();
    expect(created.internalNotes).not.toContain('Should Not Assign');
    expect(created.servicePackageId).toBeUndefined();
    expect(created.agreedCustomerPrice).toBeUndefined();
    expect(mocks.packageUpdate).not.toHaveBeenCalled();
    expect(mocks.rateUpdate).not.toHaveBeenCalled();
    expect(created.guestCheckInDate).toEqual(new Date('2026-11-01T00:00:00.000Z'));
    expect(created.guestCheckOutDate).toEqual(new Date('2026-11-08T00:00:00.000Z'));
    expect(created).not.toHaveProperty('bathrooms');
    expect(mocks.awaitJobGoogleSync).toHaveBeenCalledWith('job-new');
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'MANUAL_JOB_CREATED',
        entityType: 'Job',
        entityId: 'job-new',
        changes: expect.objectContaining({
          customerId: TINA_CUSTOMER_ID,
          propertyId: TINA_PROPERTY_ID,
          status: 'RECEIVED',
        }),
      })
    );
  });

  it('copies a fixture agreed price of $250 without gross-up or a property write', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      id: TINA_PROPERTY_ID,
      customerId: TINA_CUSTOMER_ID,
      billingPolicy: null,
      bathrooms: 2.5,
      ResidentialProfile: { agreedPrice: 250 },
    });

    const res = await POST(
      request(
        tinaBody({
          serviceCategory: 'RESIDENTIAL',
          serviceType: 'Residential Maintenance Cleaning',
          priceInputMode: 'customer',
          totalAmount: 250,
          guestCheckInDate: '2026-11-01',
          guestCheckOutDate: '2026-11-08',
        })
      )
    );
    const json = await res.json();
    const created = mocks.jobCreate.mock.calls[0][0].data;

    expect(res.status).toBe(200);
    expect(mocks.protectOperationalPrice).not.toHaveBeenCalled();
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
    expect(created.totalPrice).toBe(250);
    expect(created.quotedTotal).toBe(250);
    expect(created.operationalTotal).toBe(250);
    expect(created.processingAllowanceEstimated).toBe(0);
    expect(created.guestCheckInDate).toBeNull();
    expect(created.guestCheckOutDate).toBeNull();
    expect(json.pricing.priceOverridden).toBe(false);
    expect(json.pricing.agreedPrice).toBe(250);
  });

  it('keeps an override as the customer price and a separate operational amount', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      id: TINA_PROPERTY_ID,
      customerId: TINA_CUSTOMER_ID,
      billingPolicy: null,
      ResidentialProfile: { agreedPrice: 250 },
    });

    const res = await POST(
      request(
        tinaBody({
          serviceCategory: 'RESIDENTIAL',
          serviceType: 'Residential Maintenance Cleaning',
          priceInputMode: 'customer',
          totalAmount: 275,
          operationalAmount: 250,
        })
      )
    );
    const json = await res.json();
    const created = mocks.jobCreate.mock.calls[0][0].data;

    expect(res.status).toBe(200);
    expect(mocks.protectOperationalPrice).not.toHaveBeenCalled();
    expect(created.totalPrice).toBe(275);
    expect(created.operationalTotal).toBe(250);
    expect(created.processingAllowanceEstimated).toBe(0);
    expect(json.pricing.priceOverridden).toBe(true);
  });

  it('applies processing protection only to an operational subtotal', async () => {
    mocks.protectOperationalPrice.mockResolvedValue({
      protected: true,
      customerPrice: 410,
      operationalSubtotal: 395,
      processingAllowanceEstimated: 15,
      pricingPolicyVersion: 'pp-v1',
      warning: null,
    });

    const res = await POST(
      request(tinaBody({ priceInputMode: 'operational', totalAmount: 395 }))
    );
    const created = mocks.jobCreate.mock.calls[0][0].data;

    expect(res.status).toBe(200);
    expect(mocks.protectOperationalPrice).toHaveBeenCalledWith(395);
    expect(created.totalPrice).toBe(410);
    expect(created.operationalTotal).toBe(395);
    expect(created.processingAllowanceEstimated).toBe(15);
  });

  it('warns about a same-day job and still creates the visit', async () => {
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-existing',
        jobReference: 'VM-2026-0100',
        status: 'RECEIVED',
        serviceType: 'Vacation Rental Turnover',
        preferredDate: new Date('2026-11-02T00:00:00.000Z'),
      },
    ]);

    const res = await POST(request(tinaBody()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.sameDayJobs).toEqual([
      expect.objectContaining({ id: 'job-existing', jobReference: 'VM-2026-0100' }),
    ]);
    expect(mocks.jobCreate).toHaveBeenCalledTimes(1);
    expect(mocks.logAuditEntry.mock.calls[0][0].changes.sameDayJobIds).toEqual(['job-existing']);
  });

  it('rejects a status other than Received', async () => {
    const res = await POST(request(tinaBody({ jobStatus: 'ASSIGNED' })));
    expect(res.status).toBe(400);
    expect(mocks.jobCreate).not.toHaveBeenCalled();
  });

  it('rejects an existing-customer id when the email belongs to someone else', async () => {
    const res = await POST(
      request(tinaBody({ clientEmail: 'other.person@example.com', clientFirstName: 'Other' }))
    );
    expect(res.status).toBe(400);
    expect(mocks.jobCreate).not.toHaveBeenCalled();
    expect(mocks.customerUpdate).not.toHaveBeenCalled();
    expect(mocks.customerCreate).not.toHaveBeenCalled();
  });

  it('keeps the stored customer name when the form name does not match', async () => {
    const res = await POST(request(tinaBody({ clientFirstName: 'Not', clientLastName: 'Tina' })));
    const created = mocks.jobCreate.mock.calls[0][0].data;
    expect(res.status).toBe(200);
    expect(created.customerName).toBe('Tina Martin');
    expect(created.Customer.connect.id).toBe(TINA_CUSTOMER_ID);
  });

  it('rejects a property that belongs to someone else', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      id: TINA_PROPERTY_ID,
      customerId: 'someone-else',
      billingPolicy: null,
      ResidentialProfile: null,
    });
    const res = await POST(request(tinaBody()));
    expect(res.status).toBe(400);
    expect(mocks.jobCreate).not.toHaveBeenCalled();
    expect(mocks.customerCreate).not.toHaveBeenCalled();
  });

  it('creates a new customer once and does not rewrite them afterward', async () => {
    mocks.branchFindUnique.mockResolvedValue({ id: 'branch-vt', state: 'VT', slug: 'vermont' });
    mocks.customerCreate.mockResolvedValue({
      id: 'cust-new',
      billingPolicy: 'PREPAY',
    });

    const res = await POST(
      request({
        customerMode: 'new',
        clientFirstName: 'New',
        clientLastName: 'Host',
        clientEmail: 'new.host@example.com',
        propertyAddress: '1 Main Street',
        propertyCity: 'Ludlow',
        propertyState: 'VT',
        branch: 'vermont',
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        scheduledDate: '2026-11-03',
        scheduledStartTime: '09:00',
        priceInputMode: 'operational',
        totalAmount: 180,
        paymentStatus: 'PENDING',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.customerId).toBe('cust-new');
    expect(mocks.customerCreate).toHaveBeenCalledTimes(1);
    expect(mocks.customerUpdate).not.toHaveBeenCalled();
    expect(mocks.propertyCreate).not.toHaveBeenCalled();
    expect(mocks.geocodeCustomerInBackground).toHaveBeenCalledWith('cust-new');
    expect(mocks.jobCreate.mock.calls[0][0].data.Property).toBeUndefined();
  });

  it('does not create a duplicate when the email already exists', async () => {
    mocks.branchFindUnique.mockResolvedValue({ id: 'branch-vt', state: 'VT', slug: 'vermont' });
    mocks.customerFindUnique.mockResolvedValue({ id: TINA_CUSTOMER_ID });

    const res = await POST(
      request({
        customerMode: 'new',
        clientFirstName: 'Tina',
        clientLastName: 'Martin',
        clientEmail: 'tmrmar01@aol.com',
        propertyAddress: '18 Snow Trak North',
        propertyCity: 'Ludlow',
        propertyState: 'VT',
        branch: 'vermont',
        serviceCategory: 'RESIDENTIAL',
        serviceType: 'Residential Maintenance Cleaning',
        scheduledDate: '2026-11-02',
        priceInputMode: 'customer',
        totalAmount: 250,
        paymentStatus: 'PENDING',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.customerId).toBe(TINA_CUSTOMER_ID);
    expect(mocks.customerCreate).not.toHaveBeenCalled();
    expect(mocks.jobCreate).not.toHaveBeenCalled();
  });

  describe('service package snapshots', () => {
  function winterPackage() {
    return {
      id: 'package-turnover',
      propertyId: TINA_PROPERTY_ID,
      serviceCategory: 'VACATION_RENTAL',
      serviceType: 'Vacation Rental Turnover',
      customerPrice: 350,
      operationalPrice: 340,
      includedScope: 'Turnover cleaning',
      exclusions: 'Owner closet',
      active: true,
      Rates: [
        {
          id: 'rate-december',
          label: 'December',
          customerPrice: 375,
          operationalPrice: 360,
          startsOn: new Date('2026-12-01T00:00:00.000Z'),
          endsOn: new Date('2026-12-31T00:00:00.000Z'),
          active: true,
        },
      ],
    };
  }

  let currentPackage = winterPackage();

  beforeEach(() => {
    currentPackage = winterPackage();
    mocks.packageFindMany.mockResolvedValue([currentPackage]);
    mocks.preferenceFindUnique.mockResolvedValue({
      propertyId: TINA_PROPERTY_ID,
      allowedMethods: ['ZELLE'],
      preferredMethod: 'ZELLE',
    });
  });

  it('snapshots the December rate and still syncs the calendar', async () => {
    const res = await POST(request(tinaBody({ scheduledDate: '2026-12-15', totalAmount: 375 })));
    const json = await res.json();
    const created = mocks.jobCreate.mock.calls[0][0].data;

    expect(res.status).toBe(200);
    expect(created.totalPrice).toBe(375);
    expect(created.operationalTotal).toBe(360);
    expect(created.agreedCustomerPrice).toBe(375);
    expect(created.servicePackageId).toBe('package-turnover');
    expect(created.serviceRateId).toBe('rate-december');
    expect(created.includedScopeSnapshot).toBe('Turnover cleaning');
    expect(created.exclusionsSnapshot).toBe('Owner closet');
    expect(created.paymentPreferenceSnapshot).toEqual({
      allowedMethods: ['ZELLE'],
      preferredMethod: 'ZELLE',
    });
    expect(created.priceOverridden).toBe(false);
    expect(created.processingAllowanceEstimated).toBe(0);
    expect(mocks.protectOperationalPrice).not.toHaveBeenCalled();
    expect(mocks.packageUpdate).not.toHaveBeenCalled();
    expect(mocks.rateUpdate).not.toHaveBeenCalled();
    expect(currentPackage.customerPrice).toBe(350);
    expect(currentPackage.Rates[0].customerPrice).toBe(375);
    expect(mocks.awaitJobGoogleSync).toHaveBeenCalledWith('job-new');
    expect(json.pricing.customerTotal).toBe(375);
  });

  it('keeps the snapshot when the package row changes after booking', async () => {
    await POST(request(tinaBody({ scheduledDate: '2026-12-15', totalAmount: 375 })));
    const created = mocks.jobCreate.mock.calls[0][0].data;
    currentPackage.customerPrice = 999;
    currentPackage.Rates[0].customerPrice = 999;
    currentPackage.includedScope = 'Changed after booking';

    expect(created.agreedCustomerPrice).toBe(375);
    expect(created.includedScopeSnapshot).toBe('Turnover cleaning');
    expect(mocks.packageUpdate).not.toHaveBeenCalled();
  });

  it('charges a one-off price with a reason and leaves the rate in place', async () => {
    const res = await POST(
      request(
        tinaBody({
          scheduledDate: '2026-12-15',
          visitPriceOverride: 300,
          priceOverrideReason: 'Shorter clean requested for this stay',
        })
      )
    );
    const created = mocks.jobCreate.mock.calls[0][0].data;

    expect(res.status).toBe(200);
    expect(created.totalPrice).toBe(300);
    expect(created.agreedCustomerPrice).toBe(375);
    expect(created.agreedOperationalPrice).toBe(360);
    expect(created.operationalTotal).toBe(360);
    expect(created.priceOverridden).toBe(true);
    expect(created.priceOverrideReason).toBe('Shorter clean requested for this stay');
    expect(mocks.packageUpdate).not.toHaveBeenCalled();
    expect(mocks.rateUpdate).not.toHaveBeenCalled();
    expect(mocks.awaitJobGoogleSync).toHaveBeenCalledWith('job-new');
  });

  it('does not silently ignore a typed price that differs from the package', async () => {
    const res = await POST(request(tinaBody({ scheduledDate: '2026-12-15', totalAmount: 200 })));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Package price is \$375\.00 \(December\)/);
    expect(mocks.jobCreate).not.toHaveBeenCalled();
    expect(mocks.packageUpdate).not.toHaveBeenCalled();
    expect(mocks.awaitJobGoogleSync).not.toHaveBeenCalled();
    expect(currentPackage.Rates[0].customerPrice).toBe(375);
  });

  it('keeps the agreed operational price unless a cleaner override and reason are sent', async () => {
    const kept = await POST(
      request(
        tinaBody({
          scheduledDate: '2026-12-15',
          totalAmount: 375,
          visitOperationalOverride: 300,
        })
      )
    );
    expect(kept.status).toBe(400);
    expect(mocks.jobCreate).not.toHaveBeenCalled();

    const res = await POST(
      request(
        tinaBody({
          scheduledDate: '2026-12-15',
          totalAmount: 375,
          visitOperationalOverride: 300,
          priceOverrideReason: 'Cleaner paid less for this stay',
        })
      )
    );
    const created = mocks.jobCreate.mock.calls[0][0].data;

    expect(res.status).toBe(200);
    expect(created.totalPrice).toBe(375);
    expect(created.agreedOperationalPrice).toBe(360);
    expect(created.operationalPriceOverride).toBe(300);
    expect(created.operationalTotal).toBe(300);
    expect(currentPackage.Rates[0].operationalPrice).toBe(360);
    expect(mocks.packageUpdate).not.toHaveBeenCalled();
  });

  it('rejects a one-off price without a reason before creating a job', async () => {
    const res = await POST(
      request(
        tinaBody({
          scheduledDate: '2026-12-15',
          visitPriceOverride: 300,
        })
      )
    );

    expect(res.status).toBe(400);
    expect(mocks.jobCreate).not.toHaveBeenCalled();
    expect(mocks.packageUpdate).not.toHaveBeenCalled();
    expect(mocks.awaitJobGoogleSync).not.toHaveBeenCalled();
  });
  });
});

describe('GET /api/admin/jobs/create-manual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', branchId: null });
  });

  it('returns a same-day warning without creating a job', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      id: TINA_PROPERTY_ID,
      customerId: TINA_CUSTOMER_ID,
    });
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-existing',
        jobReference: 'VM-2026-0100',
        status: 'CONFIRMED',
        serviceType: 'Vacation Rental Turnover',
        preferredDate: new Date('2026-11-02T00:00:00.000Z'),
      },
    ]);

    const res = await GET(
      new NextRequest(
        `http://localhost/api/admin/jobs/create-manual?propertyId=${TINA_PROPERTY_ID}&scheduledDate=2026-11-02&customerId=${TINA_CUSTOMER_ID}`
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.packagePrice).toBeNull();
    expect(json.sameDayJobs).toHaveLength(1);
    expect(mocks.jobCreate).not.toHaveBeenCalled();
    expect(mocks.customerCreate).not.toHaveBeenCalled();
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
  });

  it('returns the package price and rate label for the service date', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      id: TINA_PROPERTY_ID,
      customerId: TINA_CUSTOMER_ID,
    });
    mocks.jobFindMany.mockResolvedValue([]);
    mocks.preferenceFindUnique.mockResolvedValue(null);
    mocks.packageFindMany.mockResolvedValue([
      {
        id: 'package-turnover',
        propertyId: TINA_PROPERTY_ID,
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 350,
        operationalPrice: 340,
        includedScope: 'Turnover cleaning',
        exclusions: 'Owner closet',
        active: true,
        Rates: [
          {
            id: 'rate-december',
            label: 'December',
            customerPrice: 375,
            operationalPrice: 360,
            startsOn: new Date('2026-12-01T00:00:00.000Z'),
            endsOn: new Date('2026-12-31T00:00:00.000Z'),
            active: true,
          },
        ],
      },
    ]);

    const res = await GET(
      new NextRequest(
        `http://localhost/api/admin/jobs/create-manual?propertyId=${TINA_PROPERTY_ID}&scheduledDate=2026-12-15&customerId=${TINA_CUSTOMER_ID}&serviceCategory=VACATION_RENTAL&serviceType=${encodeURIComponent('Vacation Rental Turnover')}`
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.packagePrice).toEqual({
      customerPrice: 375,
      operationalPrice: 360,
      rateLabel: 'December',
    });
    expect(json.processingAllowanceDisplay).toEqual({
      preferredMethod: null,
      estimatedAllowance: 0,
      availability: 'zero',
      customerPriceUnchanged: true,
    });
    expect(mocks.jobCreate).not.toHaveBeenCalled();
  });

  it('shows a card allowance without changing the package customer price', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      id: TINA_PROPERTY_ID,
      customerId: TINA_CUSTOMER_ID,
    });
    mocks.jobFindMany.mockResolvedValue([]);
    mocks.preferenceFindUnique.mockResolvedValue({
      propertyId: TINA_PROPERTY_ID,
      allowedMethods: ['CARD'],
      preferredMethod: 'CARD',
    });
    mocks.loadProcessingPolicy.mockResolvedValue({
      enabled: true,
      percentageRate: 0.0349,
      fixedFee: 0.49,
      roundingIncrement: 5,
      policyVersion: 'pp-v1',
    });
    mocks.packageFindMany.mockResolvedValue([
      {
        id: 'package-turnover',
        propertyId: TINA_PROPERTY_ID,
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 375,
        operationalPrice: 350,
        includedScope: null,
        exclusions: null,
        active: true,
        Rates: [],
      },
    ]);

    const res = await GET(
      new NextRequest(
        `http://localhost/api/admin/jobs/create-manual?propertyId=${TINA_PROPERTY_ID}&scheduledDate=2026-12-15&customerId=${TINA_CUSTOMER_ID}&serviceCategory=VACATION_RENTAL&serviceType=${encodeURIComponent('Vacation Rental Turnover')}`
      )
    );
    const json = await res.json();

    expect(json.packagePrice.customerPrice).toBe(375);
    expect(json.processingAllowanceDisplay).toEqual({
      preferredMethod: 'CARD',
      estimatedAllowance: 15,
      availability: 'estimated',
      customerPriceUnchanged: true,
    });
    expect(mocks.jobCreate).not.toHaveBeenCalled();
  });

  it('does not show a missing card policy as a zero allowance', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      id: TINA_PROPERTY_ID,
      customerId: TINA_CUSTOMER_ID,
    });
    mocks.jobFindMany.mockResolvedValue([]);
    mocks.preferenceFindUnique.mockResolvedValue({
      propertyId: TINA_PROPERTY_ID,
      allowedMethods: ['CARD'],
      preferredMethod: 'CARD',
    });
    mocks.loadProcessingPolicy.mockResolvedValue(null);
    mocks.packageFindMany.mockResolvedValue([
      {
        id: 'package-turnover',
        propertyId: TINA_PROPERTY_ID,
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 375,
        operationalPrice: 350,
        includedScope: null,
        exclusions: null,
        active: true,
        Rates: [],
      },
    ]);

    const res = await GET(
      new NextRequest(
        `http://localhost/api/admin/jobs/create-manual?propertyId=${TINA_PROPERTY_ID}&scheduledDate=2026-12-15&customerId=${TINA_CUSTOMER_ID}&serviceCategory=VACATION_RENTAL&serviceType=${encodeURIComponent('Vacation Rental Turnover')}`
      )
    );
    const json = await res.json();

    expect(json.packagePrice.customerPrice).toBe(375);
    expect(json.processingAllowanceDisplay).toEqual({
      preferredMethod: 'CARD',
      estimatedAllowance: null,
      availability: 'unavailable',
      customerPriceUnchanged: true,
    });
  });
});
