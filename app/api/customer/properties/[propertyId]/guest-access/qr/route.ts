export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { loadOwnedProperty } from '@/lib/properties/propertyService';
import {
  STAY_QR_CACHE_HEADERS,
  StayQrError,
  loadQrReadyStayUrl,
  parseStayQrFormat,
  renderStayQr,
} from '@/lib/stay/stayQr';

type RouteContext = { params: { propertyId: string } };

/**
 * GET /api/customer/properties/[propertyId]/guest-access/qr?format=png|svg
 * Host-owned download of QR encoding the current opaque stayUrl only.
 * Fail closed unless active && qrReady.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
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

    const format = parseStayQrFormat(
      request.nextUrl.searchParams.get('format')
    );
    const { stayUrl } = await loadQrReadyStayUrl(property.id);
    const rendered = await renderStayQr(stayUrl, format);
    const body =
      typeof rendered.body === 'string'
        ? rendered.body
        : new Uint8Array(rendered.body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': rendered.contentType,
        'Content-Disposition': `attachment; filename="${rendered.filename}"`,
        ...STAY_QR_CACHE_HEADERS,
      },
    });
  } catch (error: unknown) {
    if (error instanceof StayQrError) {
      const status =
        error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'INVALID_FORMAT'
            ? 400
            : 409;
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status }
      );
    }
    const message =
      error instanceof Error ? error.message : 'Failed to generate stay QR';
    console.error('[customer/properties/:id/guest-access/qr GET]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
