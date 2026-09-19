export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/finance/owner-profitability
 *
 * Read-only owner profitability KPIs from Invoice / InvoicePayment / JobPayout.
 * Branch-scoped admins are forced to their auth.branchId (never NJ default).
 * Global admins may pass ?branchId= or omit for global aggregation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { loadOwnerProfitability } from '@/lib/finance/ownerProfitabilityReadModel';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { searchParams } = new URL(request.url);
    const requestedBranchId = searchParams.get('branchId')?.trim() || null;

    let branchId: string | null = null;
    let branchName: string | null = null;

    if (auth.branchId) {
      // Branch-scoped: ignore client branchId — enforce session scope at DB layer.
      branchId = auth.branchId;
      branchName = auth.branchName ?? null;
      if (requestedBranchId && requestedBranchId !== auth.branchId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden: cannot query another branch',
            code: 'BRANCH_SCOPE_VIOLATION',
          },
          { status: 403 }
        );
      }
    } else if (requestedBranchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: requestedBranchId },
        select: { id: true, name: true },
      });
      if (!branch) {
        return NextResponse.json(
          { success: false, error: 'Branch not found' },
          { status: 404 }
        );
      }
      branchId = branch.id;
      branchName = branch.name;
    } else {
      branchId = null;
      branchName = null;
    }

    if (branchId && !branchName) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { name: true },
      });
      branchName = branch?.name ?? null;
    }

    const snapshot = await loadOwnerProfitability(prisma, {
      branchId,
      branchName,
    });

    return NextResponse.json({
      success: true,
      profitability: snapshot,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('[owner-profitability]', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load owner profitability',
      },
      { status: 500 }
    );
  }
}
