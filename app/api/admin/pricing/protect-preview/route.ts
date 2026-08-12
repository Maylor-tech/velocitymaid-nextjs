export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { protectOperationalPrice } from '@/lib/pricing/processingPolicy';

/**
 * POST /api/admin/pricing/protect-preview
 * Preview customer price from an operational subtotal (manual job UX).
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json().catch(() => ({}));
    const operationalSubtotal = Number(body.operationalSubtotal);
    if (!Number.isFinite(operationalSubtotal) || operationalSubtotal < 0) {
      return NextResponse.json(
        { success: false, error: 'operationalSubtotal must be a non-negative number' },
        { status: 400 }
      );
    }

    const result = await protectOperationalPrice(operationalSubtotal);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Preview failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
