export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { loadPayoutExecutionDecision } from '@/lib/payout/loadPayoutExecutionDecision';
import { previewPayoutRecalc } from '@/lib/payout/payoutExecutionGuard';
import { ELIZABETH_K_PHASE2 } from '@/lib/billing/elizabethKPhase2';

/**
 * GET /api/admin/payouts/[payoutId]/recalc-preview
 * Read-only. Never executes, fails, or deletes a payout.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const decision = await loadPayoutExecutionDecision(params.payoutId);
    if (!decision) {
      return NextResponse.json({ success: false, error: 'Payout not found' }, { status: 404 });
    }

    const authorizedPreview =
      decision.preview ??
      (decision.jobId === ELIZABETH_K_PHASE2.jobId
        ? previewPayoutRecalc(
            ELIZABETH_K_PHASE2.authorizedInvoiceTotal,
            0,
            ELIZABETH_K_PHASE2.preservedQuotedTotal
          )
        : null);

    return NextResponse.json({
      success: true,
      hold: decision.hold,
      mutatePayout: false,
      execute: false,
      code: decision.code,
      reason: decision.reason,
      preview: authorizedPreview,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to preview payout recalc';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
