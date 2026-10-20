import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Prisma } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  propertyFindUnique: vi.fn(),
  packageFindFirst: vi.fn(),
  packageCreate: vi.fn(),
  packageUpdate: vi.fn(),
  packageUpdateMany: vi.fn(),
  rateDeleteMany: vi.fn(),
  rateUpdate: vi.fn(),
  rateCreate: vi.fn(),
  preferenceUpsert: vi.fn(),
  jobUpdate: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => mocks.requireRole(...args),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...args: unknown[]) => mocks.logAuditEntry(...args),
}));

vi.mock('@/lib/prisma', () => {
  let inTransaction = false;
  return {
    prisma: {
      property: { findUnique: (...args: unknown[]) => mocks.propertyFindUnique(...args) },
      job: { update: (...args: unknown[]) => mocks.jobUpdate(...args) },
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
        inTransaction = true;
        try {
          return await callback({
            propertyServicePackage: {
              findFirst: mocks.packageFindFirst,
              create: mocks.packageCreate,
              update: mocks.packageUpdate,
              updateMany: mocks.packageUpdateMany,
            },
            propertyServiceRate: {
              deleteMany: mocks.rateDeleteMany,
              update: mocks.rateUpdate,
              create: mocks.rateCreate,
            },
            propertyPaymentPreference: {
              upsert: (...args: unknown[]) => {
                if (!inTransaction) throw new Error('preference write left the transaction');
                return mocks.preferenceUpsert(...args);
              },
            },
          });
        } finally {
          inTransaction = false;
        }
      },
    },
  };
});

import { PUT } from '../route';

function put(body: unknown) {
  return new NextRequest('http://localhost/api/admin/properties/prop-1/service-agreement', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PUT service agreement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    mocks.propertyFindUnique.mockResolvedValue({ id: 'prop-1' });
    mocks.packageFindFirst.mockResolvedValue(null);
    mocks.packageCreate.mockResolvedValue({ id: 'package-1' });
    mocks.packageUpdateMany.mockResolvedValue({ count: 1 });
    mocks.rateDeleteMany.mockResolvedValue({ count: 0 });
    mocks.rateUpdate.mockResolvedValue({ id: 'rate-keep' });
    mocks.rateCreate.mockResolvedValue({ id: 'rate-new' });
    mocks.preferenceUpsert.mockResolvedValue({ id: 'pref-1' });
    mocks.logAuditEntry.mockResolvedValue('audit-1');
  });

  it('rejects an overlapping seasonal window and does not write a job', async () => {
    const res = await PUT(put({
      package: {
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 350,
        operationalPrice: 340,
        rates: [
          { label: 'November', customerPrice: 350, operationalPrice: 340, startsOn: '2026-11-01', endsOn: '2026-11-30', active: true },
          { label: 'Overlap', customerPrice: 375, operationalPrice: 360, startsOn: '2026-11-30', endsOn: '2026-12-31', active: true },
        ],
      },
    }), { params: { propertyId: 'prop-1' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/overlap/i);
    expect(mocks.packageCreate).not.toHaveBeenCalled();
    expect(mocks.jobUpdate).not.toHaveBeenCalled();
  });

  it('rejects a blank customer price instead of saving zero', async () => {
    const res = await PUT(put({
      package: {
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: '',
        operationalPrice: null,
        rates: [],
      },
    }), { params: { propertyId: 'prop-1' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Customer price is required/);
    expect(mocks.packageCreate).not.toHaveBeenCalled();
  });

  it('rejects an invalid preference before writing the package', async () => {
    const res = await PUT(put({
      package: {
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 350,
        rates: [],
      },
      paymentPreference: { allowedMethods: ['ZELLE'], preferredMethod: 'CARD' },
    }), { params: { propertyId: 'prop-1' } });

    expect(res.status).toBe(400);
    expect(mocks.packageCreate).not.toHaveBeenCalled();
    expect(mocks.preferenceUpsert).not.toHaveBeenCalled();
  });

  it('rejects a stale package edit before replacing seasonal rates', async () => {
    mocks.packageFindFirst.mockResolvedValue({
      id: 'package-1',
      updatedAt: new Date('2026-10-19T12:00:00.000Z'),
      Rates: [{ id: 'rate-keep' }],
    });
    const res = await PUT(put({
      package: {
        id: 'package-1',
        updatedAt: '2026-10-18T12:00:00.000Z',
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 350,
        rates: [],
      },
    }), { params: { propertyId: 'prop-1' } });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toMatch(/Reload/);
    expect(mocks.packageUpdate).not.toHaveBeenCalled();
    expect(mocks.rateDeleteMany).not.toHaveBeenCalled();
    expect(mocks.rateCreate).not.toHaveBeenCalled();
  });

  it('updates a kept seasonal rate and deletes only the rate that was removed', async () => {
    mocks.packageFindFirst.mockResolvedValue({
      id: 'package-1',
      updatedAt: new Date('2026-10-19T12:00:00.000Z'),
      Rates: [{ id: 'rate-keep' }, { id: 'rate-drop' }],
    });
    mocks.packageUpdate.mockResolvedValue({ id: 'package-1' });
    const res = await PUT(put({
      package: {
        id: 'package-1',
        updatedAt: '2026-10-19T12:00:00.000Z',
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 350,
        rates: [
          { id: 'rate-keep', label: 'December', customerPrice: 375, operationalPrice: 360, startsOn: '2026-12-01', endsOn: '2026-12-31', active: true },
        ],
      },
    }), { params: { propertyId: 'prop-1' } });

    expect(res.status).toBe(200);
    expect(mocks.rateUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'rate-keep' } }));
    expect(mocks.rateCreate).not.toHaveBeenCalled();
    expect(mocks.rateDeleteMany).toHaveBeenCalledWith({
      where: { packageId: 'package-1', id: { in: ['rate-drop'] } },
    });
    expect(mocks.packageUpdateMany).toHaveBeenCalledWith({
      where: { id: 'package-1', updatedAt: new Date('2026-10-19T12:00:00.000Z') },
      data: expect.any(Object),
    });
  });

  it('does not change rates when a concurrent save already moved the package', async () => {
    mocks.packageFindFirst.mockResolvedValue({
      id: 'package-1',
      updatedAt: new Date('2026-10-19T12:00:00.000Z'),
      Rates: [{ id: 'rate-keep' }],
    });
    mocks.packageUpdateMany.mockResolvedValue({ count: 0 });
    const res = await PUT(put({
      package: {
        id: 'package-1',
        updatedAt: '2026-10-19T12:00:00.000Z',
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 350,
        rates: [],
      },
    }), { params: { propertyId: 'prop-1' } });

    expect(res.status).toBe(409);
    expect(mocks.rateDeleteMany).not.toHaveBeenCalled();
    expect(mocks.rateUpdate).not.toHaveBeenCalled();
    expect(mocks.preferenceUpsert).not.toHaveBeenCalled();
  });

  it('rejects a preferred method outside the allowed methods', async () => {
    const res = await PUT(put({
      paymentPreference: { allowedMethods: ['ZELLE'], preferredMethod: 'CARD' },
    }), { params: { propertyId: 'prop-1' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/preferred/i);
    expect(mocks.preferenceUpsert).not.toHaveBeenCalled();
    expect(mocks.jobUpdate).not.toHaveBeenCalled();
  });

  it('audits a valid package and preference without a guest QR or job write', async () => {
    const res = await PUT(put({
      package: {
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 350,
        operationalPrice: 340,
        includedScope: 'Turnover',
        exclusions: 'Owner closet',
        rates: [
          { label: 'December', customerPrice: 375, operationalPrice: 360, startsOn: '2026-12-01', endsOn: '2026-12-31', active: true },
        ],
      },
      paymentPreference: { allowedMethods: ['ZELLE', 'CARD'], preferredMethod: 'ZELLE' },
    }), { params: { propertyId: 'prop-1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mocks.jobUpdate).not.toHaveBeenCalled();
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(expect.objectContaining({ action: 'SERVICE_PACKAGE_UPSERTED' }));
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(expect.objectContaining({ action: 'SERVICE_RATE_UPSERTED' }));
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(expect.objectContaining({ action: 'PAYMENT_PREFERENCE_UPDATED' }));
  });

  it('returns a plain 409 when an edit moves a package onto a service that already exists', async () => {
    const stored = [
      {
        id: 'pkg-a',
        propertyId: 'prop-1',
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        updatedAt: new Date('2026-10-19T12:00:00.000Z'),
        customerPrice: 350,
        Rates: [],
      },
      {
        id: 'pkg-b',
        propertyId: 'prop-1',
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Property Walkthrough',
        updatedAt: new Date('2026-10-19T12:00:00.000Z'),
        customerPrice: 80,
        Rates: [],
      },
    ];
    mocks.packageFindFirst.mockImplementation(async (args: { where: { id?: string; propertyId?: string } }) => {
      return stored.find((pkg) => pkg.id === args.where.id && pkg.propertyId === args.where.propertyId) ?? null;
    });
    mocks.packageUpdateMany.mockImplementation(async (args: { where: { id: string }; data: { serviceType: string; serviceCategory: string } }) => {
      const conflict = stored.some(
        (pkg) =>
          pkg.id !== args.where.id &&
          pkg.serviceCategory === args.data.serviceCategory &&
          pkg.serviceType === args.data.serviceType
      );
      if (conflict) {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
          meta: { target: ['propertyId', 'serviceCategory', 'serviceType'] },
        });
      }
      return { count: 1 };
    });

    const res = await PUT(put({
      package: {
        id: 'pkg-b',
        updatedAt: '2026-10-19T12:00:00.000Z',
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 80,
        rates: [],
      },
    }), { params: { propertyId: 'prop-1' } });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toEqual({
      success: false,
      error: 'This property already has a package for that service. Edit that package instead.',
    });
    expect(stored.find((pkg) => pkg.id === 'pkg-b')?.serviceType).toBe('Property Walkthrough');
    expect(mocks.rateUpdate).not.toHaveBeenCalled();
    expect(mocks.rateCreate).not.toHaveBeenCalled();
    expect(mocks.rateDeleteMany).not.toHaveBeenCalled();
    expect(mocks.preferenceUpsert).not.toHaveBeenCalled();
  });

  it('returns the same 409 when creating a package hits the service unique key', async () => {
    mocks.packageCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: 'property_service_packages_identity_key' },
      })
    );

    const res = await PUT(put({
      package: {
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 100,
        rates: [],
      },
    }), { params: { propertyId: 'prop-1' } });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe('This property already has a package for that service. Edit that package instead.');
    expect(mocks.rateCreate).not.toHaveBeenCalled();
  });

  it('does not turn a different unique-key failure into the package conflict', async () => {
    mocks.packageCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      })
    );

    await expect(PUT(put({
      package: {
        serviceCategory: 'VACATION_RENTAL',
        serviceType: 'Vacation Rental Turnover',
        customerPrice: 100,
        rates: [],
      },
    }), { params: { propertyId: 'prop-1' } })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('does not reference jobs, Stripe, invoices, or guest QR', () => {
    const source = readFileSync(path.join(process.cwd(), 'app/api/admin/properties/[propertyId]/service-agreement/route.ts'), 'utf8');
    expect(source).not.toMatch(/propertyGuestAccess|stripe|InvoicePayment|JobPayout|job\.create|job\.update/i);
  });
});
