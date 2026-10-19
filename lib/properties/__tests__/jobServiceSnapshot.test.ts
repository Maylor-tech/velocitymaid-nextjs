import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ServicePackageValidationError } from '../servicePackage';
import { buildJobServiceSnapshot } from '../jobServiceSnapshot';
import type { PaymentPreferenceRecord, ServicePackageRecord as Package } from '../servicePackage';

const PROPERTY_ID = 'property-bear-hill';

function winterPackage(): Package {
  return {
    id: 'package-turnover',
    propertyId: PROPERTY_ID,
    serviceCategory: 'VACATION_RENTAL',
    serviceType: 'Vacation Rental Turnover',
    customerPrice: 350,
    operationalPrice: 340,
    includedScope: 'Turnover cleaning, garbage, and pool check',
    exclusions: 'Owner closet',
    active: true,
    rates: [
      {
        id: 'rate-november',
        label: 'November',
        customerPrice: 350,
        operationalPrice: 340,
        startsOn: '2026-11-01',
        endsOn: '2026-11-30',
        active: true,
      },
      {
        id: 'rate-december',
        label: 'December',
        customerPrice: 375,
        operationalPrice: 360,
        startsOn: '2026-12-01',
        endsOn: '2026-12-31',
        active: true,
      },
    ],
  };
}

const preference: PaymentPreferenceRecord = {
  propertyId: PROPERTY_ID,
  allowedMethods: ['ZELLE', 'CARD'],
  preferredMethod: 'ZELLE',
};

function snap(
  packages: Package[],
  serviceDate: string,
  override: number | null = null,
  reason: string | null = null
) {
  return buildJobServiceSnapshot({
    propertyId: PROPERTY_ID,
    serviceCategory: 'VACATION_RENTAL',
    serviceType: 'Vacation Rental Turnover',
    serviceDate,
    packages,
    preferences: [preference],
    typedCustomerPrice: null,
    visitPriceOverride: override,
    visitOperationalOverride: null,
    priceOverrideReason: reason,
  });
}

describe('buildJobServiceSnapshot', () => {
  it('returns null when the property has no package', () => {
    expect(snap([], '2026-12-15')).toBeNull();
  });

  it('uses the America/New_York seasonal rate and keeps a copy after the package changes', () => {
    const packages = [winterPackage()];
    const november = snap(packages, '2026-11-30T23:30:00-05:00');
    const december = snap(packages, '2026-12-01T00:30:00-05:00');

    expect(november).toMatchObject({
      serviceRateId: 'rate-november',
      agreedCustomerPrice: 350,
      agreedOperationalPrice: 340,
      customerTotal: 350,
      operationalTotal: 340,
      priceOverridden: false,
    });
    expect(december).toMatchObject({
      servicePackageId: 'package-turnover',
      serviceRateId: 'rate-december',
      agreedCustomerPrice: 375,
      agreedOperationalPrice: 360,
      customerTotal: 375,
      operationalTotal: 360,
      includedScopeSnapshot: 'Turnover cleaning, garbage, and pool check',
      exclusionsSnapshot: 'Owner closet',
      paymentPreferenceSnapshot: {
        allowedMethods: ['ZELLE', 'CARD'],
        preferredMethod: 'ZELLE',
      },
      priceOverridden: false,
      priceOverrideReason: null,
    });

    packages[0].customerPrice = 999;
    packages[0].rates[1].customerPrice = 999;
    packages[0].includedScope = 'Changed later';
    preference.preferredMethod = 'CARD';

    expect(december?.agreedCustomerPrice).toBe(375);
    expect(december?.includedScopeSnapshot).toBe('Turnover cleaning, garbage, and pool check');
    expect(december?.paymentPreferenceSnapshot?.preferredMethod).toBe('ZELLE');
    expect(packages[0].customerPrice).toBe(999);
  });

  it('stores a one-off price and reason without changing the standing rate', () => {
    const packages = [winterPackage()];
    const snapshot = snap(packages, '2026-12-15', 300, 'Shorter clean requested for this stay');

    expect(snapshot).toMatchObject({
      agreedCustomerPrice: 375,
      agreedOperationalPrice: 360,
      customerTotal: 300,
      operationalTotal: 360,
      priceOverridden: true,
      priceOverrideReason: 'Shorter clean requested for this stay',
      serviceRateId: 'rate-december',
    });
    expect(packages[0].customerPrice).toBe(350);
    expect(packages[0].rates[1].customerPrice).toBe(375);
  });

  it('rejects a typed price that differs from the matched package price', () => {
    const packages = [winterPackage()];
    expect(() =>
      buildJobServiceSnapshot({
        propertyId: PROPERTY_ID,
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        serviceDate: '2026-12-15',
        packages,
        preferences: [preference],
        typedCustomerPrice: 200,
        visitPriceOverride: null,
        visitOperationalOverride: null,
        priceOverrideReason: null,
      })
    ).toThrow(expect.objectContaining({ code: 'PRICE_TYPED_MISMATCH' }));
    expect(packages[0].rates[1].customerPrice).toBe(375);
    expect(packages[0].customerPrice).toBe(350);
  });

  it('keeps the agreed operational price when the cleaner override is blank', () => {
    const snapshot = buildJobServiceSnapshot({
      propertyId: PROPERTY_ID,
      serviceCategory: 'VACATION_RENTAL',
      serviceType: 'Vacation Rental Turnover',
      serviceDate: '2026-12-15',
      packages: [winterPackage()],
      preferences: [preference],
      typedCustomerPrice: 300,
      visitPriceOverride: 300,
      visitOperationalOverride: null,
      priceOverrideReason: 'Shorter clean requested for this stay',
    });

    expect(snapshot).toMatchObject({
      customerTotal: 300,
      agreedOperationalPrice: 360,
      operationalPriceOverride: null,
      operationalTotal: 360,
    });
  });

  it('applies an optional operational override with the same reason', () => {
    const packages = [winterPackage()];
    const snapshot = buildJobServiceSnapshot({
      propertyId: PROPERTY_ID,
      serviceCategory: 'VACATION_RENTAL',
      serviceType: 'Vacation Rental Turnover',
      serviceDate: '2026-12-15',
      packages,
      preferences: [preference],
      typedCustomerPrice: 375,
      visitPriceOverride: null,
      visitOperationalOverride: 300,
      priceOverrideReason: 'Cleaner paid less for this stay',
    });

    expect(snapshot).toMatchObject({
      customerTotal: 375,
      agreedCustomerPrice: 375,
      agreedOperationalPrice: 360,
      operationalPriceOverride: 300,
      operationalTotal: 300,
      priceOverridden: true,
    });
    expect(packages[0].rates[1].operationalPrice).toBe(360);
  });

  it('requires a reason before accepting a one-off price', () => {
    expect(() => snap([winterPackage()], '2026-12-15', 300, '  ')).toThrow(
      expect.objectContaining({ code: 'PRICE_OVERRIDE_REASON' })
    );
    expect(() => snap([], '2026-12-15', 300, 'No package')).toThrow(ServicePackageValidationError);
  });
});

describe('job snapshot migration', () => {
  it('adds nullable Job columns and does not touch invoice or payout rows', () => {
    const sql = readFileSync(
      path.join(process.cwd(), 'prisma/migrations/20261018200000_job_service_snapshots/migration.sql'),
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

    expect(sql).toContain('ADD COLUMN "servicePackageId" TEXT');
    expect(sql).toContain('ADD COLUMN "serviceRateId" TEXT');
    expect(sql).toContain('ADD COLUMN "agreedCustomerPrice" DECIMAL(10,2)');
    expect(sql).toContain('ADD COLUMN "agreedOperationalPrice" DECIMAL(10,2)');
    expect(sql).toContain('ADD COLUMN "includedScopeSnapshot" TEXT');
    expect(sql).toContain('ADD COLUMN "exclusionsSnapshot" TEXT');
    expect(sql).toContain('ADD COLUMN "paymentPreferenceSnapshot" JSONB');
    expect(sql).toContain('ADD COLUMN "priceOverridden" BOOLEAN');
    expect(sql).toContain('ADD COLUMN "priceOverrideReason" TEXT');
    expect(sql).toContain('ADD COLUMN "operationalPriceOverride" DECIMAL(10,2)');
    for (const statement of statements) {
      expect(statement).not.toMatch(/^(DROP|RENAME|UPDATE|DELETE|TRUNCATE)\b/);
      expect(statement).not.toMatch(/^ALTER TABLE "(INVOICE|INVOICEPAYMENT|JOBPAYOUT)"/);
      expect(statement).not.toMatch(/\bSET NOT NULL\b/);
    }
  });

  it('does not change checkout or invoice email code', () => {
    const root = process.cwd();
    const checkout = readFileSync(path.join(root, 'app/api/checkout/route.ts'), 'utf8');
    const invoiceEmail = readFileSync(path.join(root, 'lib/email/invoiceEmails.ts'), 'utf8');
    expect(checkout).not.toMatch(/servicePackageId|visitPriceOverride/);
    expect(invoiceEmail).not.toMatch(/servicePackageId|agreedCustomerPrice/);
  });
});
