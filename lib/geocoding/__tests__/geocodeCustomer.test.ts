import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUnique, update, geocodeAddress } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  geocodeAddress: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findUnique, update },
  },
}));

vi.mock('../googleGeocode', () => ({
  geocodeAddress,
  getGoogleMapsApiKey: vi.fn(() => 'test-key'),
}));

import { geocodeCustomerDetailed } from '../geocodeCustomer';

describe('geocodeCustomerDetailed', () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
    geocodeAddress.mockReset();
  });

  it('returns NO_ADDRESS when customer has no geocodable fields', async () => {
    findUnique.mockResolvedValue({
      id: 'c1',
      defaultAddress: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      postalCode: null,
    });
    const result = await geocodeCustomerDetailed('c1');
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.reason).toBe('NO_ADDRESS');
    expect(geocodeAddress).not.toHaveBeenCalled();
  });

  it('persists lat/lng for a valid address (explicit one-customer geocode)', async () => {
    findUnique.mockResolvedValue({
      id: 'c1',
      defaultAddress: '198 Chipman Park, Middlebury, VT',
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      postalCode: null,
    });
    geocodeAddress.mockResolvedValue({ latitude: 44.01, longitude: -73.17 });
    update.mockResolvedValue({});

    const result = await geocodeCustomerDetailed('c1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.latitude).toBe(44.01);
      expect(result.longitude).toBe(-73.17);
    }
    expect(update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: expect.objectContaining({
        latitude: 44.01,
        longitude: -73.17,
      }),
    });
  });
});
