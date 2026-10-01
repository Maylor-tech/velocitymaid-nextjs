import { describe, expect, it } from 'vitest';
import {
  isJobPacketIncomplete,
  type JobPacketProperty,
} from '@/components/cleaner/JobPacketCard';

function baseProperty(
  overrides: Partial<JobPacketProperty> = {}
): JobPacketProperty {
  return {
    id: 'prop-1',
    name: "Lou Lou's Landing",
    address: '111 Thomson Drive',
    city: 'Ludlow',
    state: 'VT',
    bedrooms: 2,
    bathrooms: 2,
    bedConfiguration: '2 queens',
    amenities: [],
    restrictedAreas: null,
    supplyStorageLocation: 'Hall closet',
    trashInstructions: 'Garage',
    linenInstructions: 'Host provides',
    standingInstructions: 'Flip all beds',
    accessType: 'Lockbox',
    accessNotes: 'Code on file',
    standardCheckoutTime: '10:00 AM',
    standardCheckinTime: '4:00 PM',
    ...overrides,
  };
}

describe('isJobPacketIncomplete', () => {
  it('is incomplete when property is null', () => {
    expect(isJobPacketIncomplete(null)).toBe(true);
  });

  it('is incomplete when access is missing', () => {
    expect(
      isJobPacketIncomplete(
        baseProperty({ accessType: null, accessNotes: null })
      )
    ).toBe(true);
  });

  it('is incomplete when standing instructions are missing', () => {
    expect(
      isJobPacketIncomplete(baseProperty({ standingInstructions: '  ' }))
    ).toBe(true);
  });

  it('is complete when access and standing instructions exist', () => {
    expect(isJobPacketIncomplete(baseProperty())).toBe(false);
  });
});
