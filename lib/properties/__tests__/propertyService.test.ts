/**
 * Property service — upsert, defaults snapshot, multi-property ownership.
 * Uses mocked Prisma client (no DB).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostIntakePayload } from '@/lib/hostIntake/types';
import type { Property } from '@prisma/client';
import {
  buildPropertyDefaultsForJob,
  createOrUpdatePropertyFromHostIntake,
  findPropertyForCustomerAddress,
  toCleanerPropertyView,
} from '../propertyService';

function basePayload(overrides: Partial<HostIntakePayload> = {}): HostIntakePayload {
  return {
    propertyAddress: '111 Thomson Drive',
    city: 'Ludlow',
    bedrooms: '2',
    bathrooms: '2',
    squareFootage: '1400',
    bedConfiguration: '2 queens',
    propertyAmenities: ['Washer/Dryer', 'Hot tub'],
    restrictedAreas: 'Owner closet',
    bookingPlatforms: ['Airbnb'],
    accessType: 'Lockbox',
    accessTypeOther: '',
    willSendAccessDetails: true,
    guestCheckoutTime: '10:00 AM',
    guestCheckoutTimeOther: '',
    guestCheckinTime: '4:00 PM',
    guestCheckinTimeOther: '',
    supplyStorageLocation: 'Hall closet',
    trashBinLocation: 'Garage',
    serviceTypes: ['Vacation rental turnover'],
    turnoverFrequency: 'Weekly',
    hasCleaner: 'No',
    linenProvider: 'Host provides',
    sameDayTurnovers: 'Sometimes',
    bookingAdvanceNotice: '2 days',
    propertyActiveSeasons: ['Summer', 'Fall'],
    preferredPaymentMethod: 'Card',
    specialInstructions: 'Leave lights on for evening arrivals',
    fullName: 'Tiffany Mayo',
    email: 'loulouslandingvt@gmail.com',
    phone: '2039549764',
    preferredContact: 'Email',
    bestTimeToReach: 'Morning',
    ...overrides,
  };
}

function makeProperty(overrides: Partial<Property> = {}): Property {
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
    restrictedAreas: null,
    accessType: 'Lockbox',
    accessNotes: 'CODE-SHOULD-NOT-LEAK',
    supplyStorageLocation: 'Hall closet',
    trashInstructions: 'Garage',
    linenInstructions: 'Host provides',
    standardCheckoutTime: '10:00 AM',
    standardCheckinTime: '4:00 PM',
    turnoverFrequency: 'Weekly',
    sameDayTurnovers: 'Sometimes',
    standingInstructions: 'Leave lights on',
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01'),
    ...overrides,
  };
}

describe('buildPropertyDefaultsForJob', () => {
  it('snapshots address for Job create without live coupling', () => {
    const property = makeProperty();
    const defaults = buildPropertyDefaultsForJob(property);
    expect(defaults).toEqual({
      propertyId: 'prop-1',
      address: '111 Thomson Drive',
      serviceLocation: 'Ludlow',
    });
    // Documented contract: later Property.address changes must not rewrite Job.
    property.address = '999 Changed Lane';
    expect(defaults.address).toBe('111 Thomson Drive');
  });
});

describe('toCleanerPropertyView', () => {
  it('includes accessNotes for authorized cleaner payloads (Calendar must not)', () => {
    const view = toCleanerPropertyView(makeProperty());
    expect(view.accessNotes).toBe('CODE-SHOULD-NOT-LEAK');
    expect(view.standingInstructions).toBe('Leave lights on');
  });
});

describe('createOrUpdatePropertyFromHostIntake', () => {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  const create = vi.fn();
  const update = vi.fn();

  const db = {
    property: { findMany, findFirst, create, update },
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates Property from intake when none exists', async () => {
    findMany.mockResolvedValue([]);
    create.mockImplementation(async ({ data }: { data: Property }) => ({
      id: 'new-prop',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await createOrUpdatePropertyFromHostIntake(
      db,
      'cust-1',
      basePayload()
    );

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      customerId: 'cust-1',
      address: '111 Thomson Drive',
      city: 'Ludlow',
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['Washer/Dryer', 'Hot tub'],
      standingInstructions: 'Leave lights on for evening arrivals',
      accessType: 'Lockbox',
      accessNotes: null,
      linenInstructions: 'Host provides',
    });
    expect(result.id).toBe('new-prop');
    expect(update).not.toHaveBeenCalled();
  });

  it('updates existing Property for same customer + address (no duplicate)', async () => {
    const existing = makeProperty({ name: 'Ludlow Property' });
    findMany.mockResolvedValue([existing]);
    update.mockResolvedValue({
      ...existing,
      standingInstructions: 'Updated instructions',
    });

    await createOrUpdatePropertyFromHostIntake(
      db,
      'cust-1',
      basePayload({ specialInstructions: 'Updated instructions' })
    );

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prop-1' },
        data: expect.objectContaining({
          standingInstructions: 'Updated instructions',
        }),
      })
    );
  });

  it('creates a second Property when the same customer has a different address', async () => {
    findMany.mockResolvedValue([makeProperty()]);
    create.mockImplementation(async ({ data }: { data: Property }) => ({
      id: 'prop-2',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await createOrUpdatePropertyFromHostIntake(
      db,
      'cust-1',
      basePayload({
        propertyAddress: '50 Main Street',
        city: 'Ludlow',
      })
    );

    expect(create).toHaveBeenCalledTimes(1);
    expect(result.address).toBe('50 Main Street');
    expect(update).not.toHaveBeenCalled();
  });

  it('preserves a custom property name like Lou Lou\'s Landing on update', async () => {
    const existing = makeProperty({ name: "Lou Lou's Landing" });
    findMany.mockResolvedValue([existing]);
    update.mockResolvedValue(existing);

    await createOrUpdatePropertyFromHostIntake(db, 'cust-1', basePayload());

    expect(update.mock.calls[0][0].data.name).toBe("Lou Lou's Landing");
  });
});

describe('findPropertyForCustomerAddress', () => {
  it('resolves by explicit propertyId when owned by customer', async () => {
    const findFirst = vi.fn().mockResolvedValue(makeProperty());
    const db = {
      property: { findFirst, findMany: vi.fn() },
    } as never;

    const found = await findPropertyForCustomerAddress(
      db,
      'cust-1',
      '111 Thomson Drive',
      { propertyId: 'prop-1' }
    );
    expect(found?.id).toBe('prop-1');
    expect(findFirst).toHaveBeenCalled();
  });
});
