import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ServicePackageValidationError,
  assertSeasonalRatesDoNotOverlap,
  paymentPreferenceForProperty,
  resolvePropertyServiceTerms,
  validatePaymentPreference,
  type ServicePackageRecord,
  type ServiceRateRecord,
} from '../servicePackage';

const PROPERTY_A = 'property-a';
const PROPERTY_B = 'property-b';

function rate(overrides: Partial<ServiceRateRecord> = {}): ServiceRateRecord {
  return {
    id: 'rate-winter',
    label: 'Winter',
    customerPrice: 375,
    operationalPrice: 375,
    startsOn: '2026-12-01',
    endsOn: '2027-03-31',
    active: true,
    ...overrides,
  };
}

function pkg(overrides: Partial<ServicePackageRecord> = {}): ServicePackageRecord {
  return {
    id: 'package-a',
    propertyId: PROPERTY_A,
    serviceCategory: 'VACATION_RENTAL',
    serviceType: 'Vacation Rental Turnover',
    customerPrice: 350,
    operationalPrice: 350,
    includedScope: 'Turnover cleaning',
    exclusions: 'Owner closet',
    active: true,
    rates: [rate()],
    ...overrides,
  };
}

describe('resolvePropertyServiceTerms', () => {
  it('returns null when a property has no package', () => {
    expect(
      resolvePropertyServiceTerms({
        propertyId: PROPERTY_A,
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        serviceDate: '2026-12-15',
        packages: [],
      })
    ).toBeNull();
  });

  it('does not use another property or customer package', () => {
    expect(
      resolvePropertyServiceTerms({
        propertyId: PROPERTY_B,
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        serviceDate: '2026-12-15',
        packages: [pkg()],
      })
    ).toBeNull();
  });

  it('ignores an inactive package and a different service', () => {
    expect(
      resolvePropertyServiceTerms({
        propertyId: PROPERTY_A,
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        serviceDate: '2026-12-15',
        packages: [pkg({ active: false })],
      })
    ).toBeNull();

    expect(
      resolvePropertyServiceTerms({
        propertyId: PROPERTY_A,
        serviceCategory: 'RESIDENTIAL',
        serviceType: 'Residential Maintenance Cleaning',
        serviceDate: '2026-12-15',
        packages: [pkg()],
      })
    ).toBeNull();
  });

  it('keeps customer and operational prices separate for a seasonal window', () => {
    const terms = resolvePropertyServiceTerms({
      propertyId: PROPERTY_A,
      serviceCategory: 'VACATION_RENTAL',
      serviceType: 'Vacation Rental Turnover',
      serviceDate: '2026-12-01',
      packages: [
        pkg({
          rates: [rate({ customerPrice: 375, operationalPrice: 360 })],
        }),
      ],
    });

    expect(terms).toMatchObject({
      propertyId: PROPERTY_A,
      packageId: 'package-a',
      rateId: 'rate-winter',
      customerPrice: 375,
      operationalPrice: 360,
      priceSource: 'seasonal',
      includedScope: 'Turnover cleaning',
      exclusions: 'Owner closet',
    });
    expect(terms).not.toHaveProperty('processingAllowanceEstimated');
  });

  it('uses the America/New_York calendar day across midnight', () => {
    const packages = [
      pkg({
        rates: [
          rate({
            id: 'rate-november',
            label: 'November',
            customerPrice: 350,
            operationalPrice: 350,
            startsOn: '2026-11-01',
            endsOn: '2026-11-30',
          }),
          rate({
            id: 'rate-december',
            label: 'December',
            customerPrice: 375,
            operationalPrice: 375,
            startsOn: '2026-12-01',
            endsOn: '2026-12-31',
          }),
        ],
      }),
    ];
    const visit = {
      propertyId: PROPERTY_A,
      serviceCategory: 'VACATION_RENTAL' as const,
      serviceType: 'Vacation Rental Turnover',
      packages,
    };

    expect(
      resolvePropertyServiceTerms({
        ...visit,
        serviceDate: '2026-11-30T23:30:00-05:00',
      })?.rateId
    ).toBe('rate-november');
    expect(
      resolvePropertyServiceTerms({
        ...visit,
        serviceDate: '2026-12-01T00:30:00-05:00',
      })?.rateId
    ).toBe('rate-december');
  });

  it('uses the standing package price outside every seasonal window', () => {
    const terms = resolvePropertyServiceTerms({
      propertyId: PROPERTY_A,
      serviceCategory: 'VACATION_RENTAL',
      serviceType: 'Vacation Rental Turnover',
      serviceDate: '2026-11-30',
      packages: [pkg()],
    });

    expect(terms).toMatchObject({
      rateId: null,
      customerPrice: 350,
      operationalPrice: 350,
      priceSource: 'standing',
    });
  });

  it('selects a residential package without affecting vacation-rental terms', () => {
    const residential = pkg({
      id: 'package-residential',
      serviceCategory: 'RESIDENTIAL',
      serviceType: 'Residential Maintenance Cleaning',
      customerPrice: 250,
      operationalPrice: 250,
      rates: [],
    });

    expect(
      resolvePropertyServiceTerms({
        propertyId: PROPERTY_A,
        serviceCategory: 'RESIDENTIAL',
        serviceType: 'Residential Maintenance Cleaning',
        serviceDate: '2026-10-18',
        packages: [residential, pkg()],
      })
    ).toMatchObject({
      packageId: 'package-residential',
      customerPrice: 250,
      priceSource: 'standing',
    });
  });
});

describe('seasonal rate overlap', () => {
  it('accepts adjacent windows and an inactive overlapping history row', () => {
    expect(() =>
      assertSeasonalRatesDoNotOverlap([
        rate({ id: 'winter', endsOn: '2027-03-31' }),
        rate({
          id: 'spring',
          label: 'Spring',
          startsOn: '2027-04-01',
          endsOn: '2027-05-31',
        }),
        rate({
          id: 'old-winter',
          startsOn: '2026-12-15',
          endsOn: '2027-01-15',
          active: false,
        }),
      ])
    ).not.toThrow();
  });

  it('rejects active windows that share a day, including an open-ended rate', () => {
    expect(() =>
      assertSeasonalRatesDoNotOverlap([
        rate({ endsOn: '2027-04-01' }),
        rate({ id: 'spring', startsOn: '2027-04-01', endsOn: '2027-05-31' }),
      ])
    ).toThrow(ServicePackageValidationError);

    expect(() =>
      assertSeasonalRatesDoNotOverlap([
        rate({ id: 'open', endsOn: null }),
        rate({ id: 'later', startsOn: '2027-06-01', endsOn: '2027-08-31' }),
      ])
    ).toThrowError(/overlap/i);
  });

  it('rejects a rate that ends before it starts', () => {
    expect(() =>
      assertSeasonalRatesDoNotOverlap([
        rate({ startsOn: '2027-04-02', endsOn: '2027-04-01' }),
      ])
    ).toThrowError(/ends before/i);
  });

  it('refuses to resolve a package whose active rates overlap', () => {
    expect(() =>
      resolvePropertyServiceTerms({
        propertyId: PROPERTY_A,
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        serviceDate: '2026-12-15',
        packages: [
          pkg({
            rates: [
              rate(),
              rate({ id: 'overlap', startsOn: '2027-03-01', endsOn: '2027-04-30' }),
            ],
          }),
        ],
      })
    ).toThrowError(/overlap/i);
  });
});

describe('payment preference', () => {
  it('accepts cash, check, Zelle, and card without a fee amount', () => {
    const preference = validatePaymentPreference({
      propertyId: PROPERTY_A,
      allowedMethods: ['ZELLE', 'CARD', 'ZELLE'],
      preferredMethod: 'ZELLE',
    });

    expect(preference).toEqual({
      propertyId: PROPERTY_A,
      allowedMethods: ['ZELLE', 'CARD'],
      preferredMethod: 'ZELLE',
    });
    expect(preference).not.toHaveProperty('processingAllowanceEstimated');
  });

  it('rejects methods outside cash, check, Zelle, and card', () => {
    expect(() =>
      validatePaymentPreference({
        propertyId: PROPERTY_A,
        allowedMethods: ['VENMO'],
        preferredMethod: 'VENMO',
      })
    ).toThrow(ServicePackageValidationError);
  });

  it('requires the preferred method to be allowed and the property to match', () => {
    expect(() =>
      validatePaymentPreference({
        propertyId: PROPERTY_A,
        allowedMethods: ['CASH', 'CHECK'],
        preferredMethod: 'CARD',
      })
    ).toThrowError(/preferred/i);

    expect(
      paymentPreferenceForProperty(PROPERTY_B, [
        validatePaymentPreference({
          propertyId: PROPERTY_A,
          allowedMethods: ['CASH'],
          preferredMethod: 'CASH',
        }),
      ])
    ).toBeNull();
  });
});

describe('foundation boundaries', () => {
  const root = process.cwd();

  it('keeps the migration additive and away from historical money tables', () => {
    const sql = readFileSync(
      path.join(root, 'prisma/migrations/20261018180000_property_service_packages/migration.sql'),
      'utf8'
    );
    const statements = sql
      .split(';')
      .map((statement) =>
        statement
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n')
          .trim()
          .toUpperCase()
      )
      .filter(Boolean);

    expect(statements.some((statement) => statement.startsWith('CREATE TABLE "PROPERTY_SERVICE_PACKAGES"'))).toBe(true);
    expect(statements.some((statement) => statement.startsWith('CREATE TABLE "PROPERTY_SERVICE_RATES"'))).toBe(true);
    expect(statements.some((statement) => statement.startsWith('CREATE TABLE "PROPERTY_PAYMENT_PREFERENCES"'))).toBe(true);
    for (const statement of statements) {
      expect(statement).not.toMatch(/^(DROP|RENAME|UPDATE|DELETE|TRUNCATE)\b/);
      expect(statement).not.toMatch(/^ALTER TABLE "(JOB|INVOICE|INVOICEPAYMENT|JOBPAYOUT)"/);
      expect(statement).not.toMatch(/\bSET NOT NULL\b/);
    }
    expect(sql).not.toMatch(/fe494d88|1233f6e1|cmuijy8vg|cmuoajao8/);
  });

  it('does not change manual job creation, Stripe, invoices, or guest QR', () => {
    const source = readFileSync(path.join(root, 'lib/properties/servicePackage.ts'), 'utf8');
    const createManual = readFileSync(
      path.join(root, 'app/api/admin/jobs/create-manual/route.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/stripe|protectOperationalPrice|propertyGuestAccess|InvoicePayment|JobPayout/i);
    expect(createManual).not.toMatch(/PropertyServicePackage|servicePackage|PropertyPaymentPreference/);
  });
});
