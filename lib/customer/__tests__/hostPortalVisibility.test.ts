import { describe, expect, it } from 'vitest';
import { customerJobListWhere } from '../customerJobList';
import { resolveAuthenticatedBookingCta } from '../requestCleaningCta';

describe('customerJobListWhere', () => {
  it('lists upcoming host Jobs including PENDING payment', () => {
    const where = customerJobListWhere('cust-ray', 'upcoming');
    expect(where).toEqual({
      customerId: 'cust-ray',
      status: {
        notIn: ['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY'],
      },
    });
    expect(where).not.toHaveProperty('paymentStatus');
  });

  it('puts completed and cancelled Jobs in past regardless of payment', () => {
    expect(customerJobListWhere('cust-ray', 'past')).toEqual({
      customerId: 'cust-ray',
      status: { in: ['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY'] },
    });
  });

  it('keeps Submitted for QC jobs in upcoming, not past', () => {
    const upcoming = customerJobListWhere('cust-ray', 'upcoming');
    const past = customerJobListWhere('cust-ray', 'past');
    expect(upcoming.status).toEqual({
      notIn: ['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY'],
    });
    expect(past.status).toEqual({
      in: ['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY'],
    });
  });
});

describe('resolveAuthenticatedBookingCta', () => {
  it('uses Request Cleaning for a Vermont host with one property', () => {
    expect(
      resolveAuthenticatedBookingCta({
        propertyCount: 1,
        firstPropertyId: 'prop-chipman',
      })
    ).toEqual({
      href: '/customer/properties/prop-chipman/add-cleaning',
      label: 'Request Cleaning',
      isHostCta: true,
    });
  });

  it('keeps /book for PREPAY customers with no property profile', () => {
    expect(
      resolveAuthenticatedBookingCta({
        propertyCount: 0,
        firstPropertyId: null,
      })
    ).toEqual({
      href: '/book',
      label: 'New Booking +',
      isHostCta: false,
    });
  });
});
