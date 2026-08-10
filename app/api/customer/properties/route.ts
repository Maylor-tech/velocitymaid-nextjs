export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import {
  loadCustomerProperties,
  toHostPropertyView,
} from '@/lib/properties/propertyService';

/**
 * GET /api/customer/properties
 * List Properties owned by the authenticated Customer.
 */
export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const properties = await loadCustomerProperties(prisma, session.customerId);
    return NextResponse.json({
      success: true,
      properties: properties.map(toHostPropertyView),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load properties';
    console.error('[customer/properties]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
