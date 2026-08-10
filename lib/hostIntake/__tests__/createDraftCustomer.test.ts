/**
 * Host intake → Property persistence (mocked Prisma).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostIntakePayload } from '@/lib/hostIntake/types';

const findUniqueBranch = vi.fn();
const findUniqueCustomer = vi.fn();
const createCustomer = vi.fn();
const updateCustomer = vi.fn();
const upsertPipelineLeadFromIntake = vi.fn();
const createOrUpdatePropertyFromHostIntake = vi.fn();
const geocodeCustomerInBackground = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    branch: { findUnique: (...a: unknown[]) => findUniqueBranch(...a) },
    customer: {
      findUnique: (...a: unknown[]) => findUniqueCustomer(...a),
      create: (...a: unknown[]) => createCustomer(...a),
      update: (...a: unknown[]) => updateCustomer(...a),
    },
  },
}));

vi.mock('@/lib/leadCenter/syncFromCustomer', () => ({
  upsertPipelineLeadFromIntake: (...a: unknown[]) =>
    upsertPipelineLeadFromIntake(...a),
}));

vi.mock('@/lib/properties/propertyService', () => ({
  createOrUpdatePropertyFromHostIntake: (...a: unknown[]) =>
    createOrUpdatePropertyFromHostIntake(...a),
}));

vi.mock('@/lib/geocoding/geocodeCustomer', () => ({
  geocodeCustomerInBackground: (...a: unknown[]) =>
    geocodeCustomerInBackground(...a),
}));

import { createDraftHostCustomer } from '@/lib/hostIntake/createDraftCustomer';

function payload(overrides: Partial<HostIntakePayload> = {}): HostIntakePayload {
  return {
    propertyAddress: '111 Thomson Drive',
    city: 'Ludlow',
    bedrooms: '2',
    bathrooms: '2',
    squareFootage: '',
    bedConfiguration: '',
    propertyAmenities: [],
    restrictedAreas: '',
    bookingPlatforms: ['Airbnb'],
    accessType: 'Lockbox',
    accessTypeOther: '',
    willSendAccessDetails: true,
    guestCheckoutTime: '10:00 AM',
    guestCheckoutTimeOther: '',
    guestCheckinTime: '4:00 PM',
    guestCheckinTimeOther: '',
    supplyStorageLocation: '',
    trashBinLocation: '',
    serviceTypes: ['Vacation rental turnover'],
    turnoverFrequency: '',
    hasCleaner: '',
    linenProvider: 'Host provides',
    sameDayTurnovers: 'No',
    bookingAdvanceNotice: '',
    propertyActiveSeasons: ['Summer'],
    preferredPaymentMethod: 'Card',
    specialInstructions: 'Standing notes',
    fullName: 'Tiffany Mayo',
    email: 'loulouslandingvt@gmail.com',
    phone: '2039549764',
    preferredContact: '',
    bestTimeToReach: '',
    ...overrides,
  };
}

describe('createDraftHostCustomer Property persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueBranch.mockResolvedValue({ id: 'branch-vt' });
    upsertPipelineLeadFromIntake.mockResolvedValue({});
    createOrUpdatePropertyFromHostIntake.mockResolvedValue({
      id: 'prop-1',
      address: '111 Thomson Drive',
    });
  });

  it('creates Customer and Property on first intake', async () => {
    findUniqueCustomer.mockResolvedValue(null);
    createCustomer.mockResolvedValue({
      id: 'cust-new',
      email: 'loulouslandingvt@gmail.com',
      firstName: 'Tiffany',
      lastName: 'Mayo',
    });

    const result = await createDraftHostCustomer(payload());

    expect(createCustomer).toHaveBeenCalled();
    expect(createOrUpdatePropertyFromHostIntake).toHaveBeenCalledWith(
      expect.anything(),
      'cust-new',
      expect.objectContaining({ propertyAddress: '111 Thomson Drive' })
    );
    expect(result.property.id).toBe('prop-1');
    expect(result.customer.id).toBe('cust-new');
  });

  it('updates existing Customer and upserts Property', async () => {
    findUniqueCustomer.mockResolvedValue({
      id: 'cust-1',
      lastName: 'Mayo',
      phone: '2039549764',
      branchId: 'branch-vt',
    });
    updateCustomer.mockResolvedValue({
      id: 'cust-1',
      email: 'loulouslandingvt@gmail.com',
      firstName: 'Tiffany',
      lastName: 'Mayo',
    });

    await createDraftHostCustomer(payload());

    expect(updateCustomer).toHaveBeenCalled();
    expect(createOrUpdatePropertyFromHostIntake).toHaveBeenCalledWith(
      expect.anything(),
      'cust-1',
      expect.any(Object)
    );
  });
});
