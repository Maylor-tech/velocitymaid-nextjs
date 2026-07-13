export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { TravelZone } from '@prisma/client';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { geocodeCustomerInBackground } from '@/lib/geocoding/geocodeCustomer';
import { getCustomerPortalStats } from '@/lib/admin/customerPortalStats';

const VALID_ZONES = new Set<string>(Object.values(TravelZone));

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        defaultAddress: true,
        travelZone: true,
        archivedAt: true,
        archivedBy: true,
        recordKind: true,
        Branch: { select: { name: true, slug: true } },
        _count: { select: { Job: true, Invoice: true } },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const portal = await getCustomerPortalStats(params.customerId);

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        jobCount: customer._count.Job,
        invoiceCount: customer._count.Invoice,
        portal,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load customer';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const data: {
      travelZone?: TravelZone | null;
      addressLine1?: string | null;
      city?: string | null;
      state?: string | null;
      defaultAddress?: string | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if ('travelZone' in body) {
      if (body.travelZone === null || body.travelZone === '') {
        data.travelZone = null;
      } else if (VALID_ZONES.has(body.travelZone)) {
        data.travelZone = body.travelZone as TravelZone;
      } else {
        return NextResponse.json({ success: false, error: 'Invalid travel zone' }, { status: 400 });
      }
    }

    if (body.addressLine1 !== undefined) data.addressLine1 = body.addressLine1?.trim() || null;
    if (body.city !== undefined) data.city = body.city?.trim() || null;
    if (body.state !== undefined) data.state = body.state?.trim() || null;
    if (body.defaultAddress !== undefined) {
      data.defaultAddress = body.defaultAddress?.trim() || null;
    }

    const customer = await prisma.customer.update({
      where: { id: params.customerId },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        travelZone: true,
        addressLine1: true,
        city: true,
        state: true,
        defaultAddress: true,
      },
    });

    if (
      body.addressLine1 !== undefined ||
      body.city !== undefined ||
      body.state !== undefined ||
      body.defaultAddress !== undefined
    ) {
      geocodeCustomerInBackground(customer.id);
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update customer';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
