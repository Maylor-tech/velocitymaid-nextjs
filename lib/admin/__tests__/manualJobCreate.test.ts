import { describe, expect, it } from 'vitest';
import {
  RESIDENTIAL_SERVICE_TYPES,
  VACATION_RENTAL_SERVICE_TYPES,
  buildManualJobRequest,
  emptyVisitDraft,
  guestDatesForCategory,
  resolveManualJobPrice,
  visitDraftFromProperty,
} from '../manualJobCreate';

const TINA_CUSTOMER_ID = '1233f6e1-5463-4a19-a35f-fbca5fe54725';
const TINA_PROPERTY_ID = 'cmuoajao80003ku0447slewk1';

describe('manual job create helpers', () => {
  it('keeps residential maintenance and vacation-rental turnovers distinct', () => {
    expect(RESIDENTIAL_SERVICE_TYPES).toContain('Residential Maintenance Cleaning');
    expect(VACATION_RENTAL_SERVICE_TYPES).toContain('Vacation Rental Turnover');
    expect(VACATION_RENTAL_SERVICE_TYPES).not.toContain('Residential Maintenance Cleaning');
  });

  it('drops guest dates for residential visits', () => {
    const checkIn = new Date('2026-11-01T00:00:00.000Z');
    const checkOut = new Date('2026-11-08T00:00:00.000Z');
    expect(guestDatesForCategory('RESIDENTIAL', checkIn, checkOut)).toEqual({
      guestCheckInDate: null,
      guestCheckOutDate: null,
    });
    expect(guestDatesForCategory('VACATION_RENTAL', checkIn, checkOut)).toEqual({
      guestCheckInDate: checkIn,
      guestCheckOutDate: checkOut,
    });
  });

  it('does not gross up a customer-facing price and keeps operational separate', () => {
    const priced = resolveManualJobPrice({
      mode: 'customer',
      totalAmount: 275,
      operationalAmount: 250,
      protectedPrice: {
        protected: true,
        customerPrice: 410,
        operationalSubtotal: 395,
        processingAllowanceEstimated: 15,
        pricingPolicyVersion: 'pp-v1',
      },
    });
    expect(priced.customerTotal).toBe(275);
    expect(priced.operationalTotal).toBe(250);
    expect(priced.processingAllowanceEstimated).toBe(0);
    expect(priced.pricingPolicyVersion).toBe('manual-customer-price');
  });

  it('clears price, service, guest dates, and travel-fee notes when the property changes', () => {
    const next = visitDraftFromProperty(
      {
        id: 'property-b',
        address: '354 Grout Road',
        city: 'Perkinsville',
        state: 'VT',
        useType: null,
        residentialServiceType: null,
        agreedPrice: null,
      },
      'Zone B Travel Fee — 18 Snow Trak North: $20\nBring the key',
      'VT'
    );
    expect(next.propertyId).toBe('property-b');
    expect(next.propertyAddress).toBe('354 Grout Road');
    expect(next.serviceType).toBe('');
    expect(next.serviceCategory).toBe('VACATION_RENTAL');
    expect(next.guestCheckInDate).toBe('');
    expect(next.guestCheckOutDate).toBe('');
    expect(next.customerPrice).toBe('');
    expect(next.operationalAmount).toBe('');
    expect(next.agreedPrice).toBeNull();
    expect(next.priceMode).toBe('operational');
    expect(next.travelFeeApplied).toBe(false);
    expect(next.internalNotes).toBe('Bring the key');
  });

  it('loads a saved agreed price for the new property and drops the previous operational amount', () => {
    const next = visitDraftFromProperty(
      {
        id: TINA_PROPERTY_ID,
        address: '18 Snow Trak North',
        city: 'Ludlow',
        state: 'VT',
        useType: 'RESIDENTIAL',
        residentialServiceType: 'Residential Maintenance Cleaning',
        agreedPrice: 250,
      },
      'Zone B Travel Fee — 354 Grout Road: $20'
    );
    expect(next.priceMode).toBe('customer');
    expect(next.customerPrice).toBe('250');
    expect(next.operationalAmount).toBe('');
    expect(next.serviceType).toBe('Residential Maintenance Cleaning');
    expect(next.serviceCategory).toBe('RESIDENTIAL');
    expect(next.internalNotes).toBe('');
    expect(emptyVisitDraft(next.internalNotes).propertyId).toBe('');
  });

  it('submits Tina’s existing ids and does not assign a cleaner', () => {
    const payload = buildManualJobRequest({
      customerMode: 'existing',
      customerId: TINA_CUSTOMER_ID,
      propertyId: TINA_PROPERTY_ID,
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
      scheduledStartTime: '10:00',
      priceMode: 'customer',
      totalAmount: 250,
      paymentStatus: 'PENDING',
    });
    expect(payload.customerId).toBe(TINA_CUSTOMER_ID);
    expect(payload.propertyId).toBe(TINA_PROPERTY_ID);
    expect(payload.jobStatus).toBe('RECEIVED');
    expect(payload.priceInputMode).toBe('customer');
    expect(payload.totalAmount).toBe(250);
    expect(payload).not.toHaveProperty('cleanerName');
    expect(payload.guestCheckInDate).toBeUndefined();
  });
});
