export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { geocodeCustomerDetailed } from '@/lib/geocoding/geocodeCustomer';
import { logAuditEntry } from '@/lib/audit';

/**
 * POST /api/admin/map/customers/[customerId]/geocode
 *
 * Explicit one-customer geocode for the admin map Missing-location panel.
 * Does not bulk-geocode. Refuses branch-scoped access outside the admin's branch.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { customerId } = params;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId is required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, branchId: true, firstName: true, lastName: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (auth.branchId && customer.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: 'BRANCH_SCOPE_VIOLATION' },
        { status: 403 }
      );
    }

    const result = await geocodeCustomerDetailed(customerId);

    if (result.ok === false) {
      const status =
        result.reason === 'NOT_FOUND'
          ? 404
          : result.reason === 'NO_ADDRESS'
            ? 422
            : result.reason === 'NO_API_KEY'
              ? 503
              : 422;
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          reason: result.reason,
        },
        { status }
      );
    }

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: 'ADMIN',
      action: 'CUSTOMER_GEOCODE',
      entityType: 'Customer',
      entityId: customerId,
      description: `Geocoded ${customer.firstName} ${customer.lastName}`.trim(),
    });

    return NextResponse.json({
      success: true,
      customerId,
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('[MAP GEOCODE]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to geocode customer';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
