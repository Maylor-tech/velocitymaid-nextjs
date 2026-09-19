export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { JobStatus, Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { formatCustomerAddress } from '@/lib/geocoding/customerAddress';
import { distanceMiles, VM_HQ } from '@/lib/geocoding/distance';
import { customerMapStatusCategory } from '@/lib/geocoding/customerMapStatus';
import { TRAVEL_ZONE_SHORT_LABEL } from '@/lib/vermont/travelZone';

function branchScopeWhere(
  authBranchId: string | null | undefined,
  branchFilter: string
): Prisma.CustomerWhereInput {
  return {
    ...(authBranchId ? { branchId: authBranchId } : {}),
    ...(branchFilter === 'vermont'
      ? { Branch: { slug: 'vermont' } }
      : branchFilter === 'new-jersey'
        ? { Branch: { slug: 'new-jersey' } }
        : {}),
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');

    const branchFilter = request.nextUrl.searchParams.get('branch') || 'all';
    const scopeWhere = branchScopeWhere(auth.branchId, branchFilter);

    const [customers, missingLocationCount] = await Promise.all([
      prisma.customer.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
          ...scopeWhere,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          leadStatus: true,
          isBlocked: true,
          travelZone: true,
          latitude: true,
          longitude: true,
          defaultAddress: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          Branch: { select: { name: true, slug: true } },
        },
      }),
      prisma.customer.count({
        where: {
          ...scopeWhere,
          OR: [{ latitude: null }, { longitude: null }],
        },
      }),
    ]);

    const customerIds = customers.map((c) => c.id);

    const jobStats =
      customerIds.length > 0
        ? await prisma.job.groupBy({
            by: ['customerId'],
            where: {
              customerId: { in: customerIds },
              status: JobStatus.COMPLETED,
            },
            _count: { id: true },
            _sum: { totalPrice: true },
          })
        : [];

    const statsByCustomer = new Map(
      jobStats
        .filter((s) => s.customerId)
        .map((s) => [
          s.customerId!,
          {
            jobsCompleted: s._count.id,
            // Sum of completed Job.totalPrice — not collected payments.
            completedJobValue: Number(s._sum.totalPrice ?? 0),
          },
        ])
    );

    const properties = customers.map((c) => {
      const lat = c.latitude!;
      const lng = c.longitude!;
      const branchSlug = c.Branch?.slug ?? null;
      const isVermont = branchSlug === 'vermont' || c.state === 'VT';
      const distanceFromHq =
        isVermont ? distanceMiles(VM_HQ.lat, VM_HQ.lng, lat, lng) : null;

      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email,
        address: formatCustomerAddress(c) || '—',
        branchName: c.Branch?.name ?? (isVermont ? 'Vermont' : 'New Jersey'),
        branchSlug,
        travelZone: c.travelZone,
        travelZoneLabel: c.travelZone
          ? TRAVEL_ZONE_SHORT_LABEL[c.travelZone]
          : null,
        latitude: lat,
        longitude: lng,
        statusCategory: customerMapStatusCategory(c.leadStatus, c.isBlocked),
        jobsCompleted: statsByCustomer.get(c.id)?.jobsCompleted ?? 0,
        completedJobValue: statsByCustomer.get(c.id)?.completedJobValue ?? 0,
        distanceFromHqMiles: distanceFromHq,
      };
    });

    const vermontWithDistance = properties.filter(
      (p) => p.distanceFromHqMiles != null
    );
    const avgDistanceFromHq =
      vermontWithDistance.length > 0
        ? vermontWithDistance.reduce((s, p) => s + (p.distanceFromHqMiles ?? 0), 0) /
          vermontWithDistance.length
        : null;

    const zoneBreakdown = {
      ZONE_A: properties.filter((p) => p.travelZone === 'ZONE_A').length,
      ZONE_B: properties.filter((p) => p.travelZone === 'ZONE_B').length,
      ZONE_C: properties.filter((p) => p.travelZone === 'ZONE_C').length,
      ZONE_D: properties.filter((p) => p.travelZone === 'ZONE_D').length,
      unset: properties.filter(
        (p) => !p.travelZone && p.branchSlug !== 'new-jersey'
      ).length,
      newJersey: properties.filter((p) => p.branchSlug === 'new-jersey').length,
    };

    return NextResponse.json({
      success: true,
      hq: VM_HQ,
      summary: {
        totalProperties: properties.length,
        missingLocationCount,
        avgDistanceFromHqMiles: avgDistanceFromHq,
        zoneBreakdown,
      },
      properties,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load map data';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
