export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import {
  loadOwnedProperty,
  toHostPropertyView,
  updateHostProperty,
  type HostPropertyUpdateInput,
} from '@/lib/properties/propertyService';

type RouteContext = { params: { propertyId: string } };

/**
 * GET /api/customer/properties/[propertyId]
 * Property detail + upcoming cleans for the owning Customer only.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const property = await loadOwnedProperty(
      prisma,
      params.propertyId,
      session.customerId
    );
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingJobs = await prisma.job.findMany({
      where: {
        propertyId: property.id,
        customerId: session.customerId,
        preferredDate: { gte: now },
        status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
      },
      orderBy: { preferredDate: 'asc' },
      select: {
        id: true,
        jobReference: true,
        preferredDate: true,
        preferredTime: true,
        serviceType: true,
        status: true,
        paymentStatus: true,
        address: true,
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      property: toHostPropertyView(property),
      upcomingJobs: upcomingJobs.map((j) => ({
        id: j.id,
        jobReference: j.jobReference,
        preferredDate: j.preferredDate?.toISOString() ?? null,
        preferredTime: j.preferredTime,
        serviceType: j.serviceType,
        status: j.status,
        paymentStatus: j.paymentStatus,
        address: j.address,
      })),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load property';
    console.error('[customer/properties/:id GET]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/customer/properties/[propertyId]
 * Update host-authorized standing Property fields.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as HostPropertyUpdateInput;

    // Reject attempts to set accessNotes via host API.
    if (
      body &&
      typeof body === 'object' &&
      'accessNotes' in (body as Record<string, unknown>)
    ) {
      return NextResponse.json(
        { success: false, error: 'accessNotes cannot be updated via host portal' },
        { status: 400 }
      );
    }

    if (body.name !== undefined && !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }
    if (body.address !== undefined && !String(body.address).trim()) {
      return NextResponse.json(
        { success: false, error: 'address is required' },
        { status: 400 }
      );
    }

    const updated = await updateHostProperty(
      prisma,
      params.propertyId,
      session.customerId,
      body
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      property: toHostPropertyView(updated),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update property';
    console.error('[customer/properties/:id PATCH]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
