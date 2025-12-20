/**
 * Admin Payout List API
 * 
 * GET /api/admin/payouts/list
 * 
 * Lists JobPayouts with optional filters.
 * 
 * Query params:
 * - jobId?: string
 * - cleanerId?: string
 * - status?: string
 * - branchId?: string
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const cleanerId = searchParams.get("cleanerId");
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};
    if (jobId) where.jobId = jobId;
    if (cleanerId) where.cleanerId = cleanerId;
    if (status && status !== "ALL") where.status = status;
    if (branchId) where.branchId = branchId;
    
    // Date range filtering
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      
      if (from && !Number.isNaN(from.getTime())) {
        where.createdAt = { ...where.createdAt, gte: from };
      }
      if (to && !Number.isNaN(to.getTime())) {
        const toEndOfDay = new Date(to);
        toEndOfDay.setHours(23, 59, 59, 999);
        where.createdAt = { ...where.createdAt, lte: toEndOfDay };
      }
    }

    // Fetch payouts
    const payouts = await prisma.jobPayout.findMany({
      where,
      select: {
        id: true,
        jobId: true,
        cleanerId: true,
        branchId: true,
        grossAmount: true,
        cleanerAmount: true,
        platformFee: true,
        currency: true,
        status: true,
        policyVersionId: true,
        policyEvalDetails: true,
        paymentMethodSnapshot: true, // Masked snapshot (already safe)
        createdAt: true,
        paidAt: true,
        executedAt: true,
        executionMethod: true,
        externalReferenceId: true,
        executionNote: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.jobPayout.count({ where });

    // Fetch cleaner and branch info separately
    const cleanerIds = Array.from(new Set(payouts.map((p) => p.cleanerId)));
    const branchIds = Array.from(new Set(payouts.map((p) => p.branchId)));
    const policyVersionIds = Array.from(
      new Set(
        payouts
          .map((p) => p.policyVersionId)
          .filter((id): id is string => id !== null)
      )
    );

    const [cleaners, branches, policyVersions] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: cleanerIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true },
      }),
      prisma.payoutPolicyVersion.findMany({
        where: { id: { in: policyVersionIds } },
        select: { id: true, name: true },
      }),
    ]);

    const cleanerMap = new Map(cleaners.map((c) => [c.id, c]));
    const branchMap = new Map(branches.map((b) => [b.id, b]));
    const policyMap = new Map(policyVersions.map((p) => [p.id, p]));

    return NextResponse.json({
      success: true,
      payouts: payouts.map((p) => {
        // Safe access to policyEvalDetails - treat as nullable
        const policy = p.policyEvalDetails ?? {};
        const adminDecision = (policy as any)?.adminDecision ?? null;
        const paymentSettlement = (policy as any)?.paymentSettlement ?? null;
        
        // Get paidAt from payout.paidAt or from paymentSettlement.timestamp
        const paidAtValue = p.paidAt?.toISOString() ?? (paymentSettlement?.timestamp ?? null);
        
        // Safe access to adminDecision fields
        const approvedAt = adminDecision?.action === "APPROVED" ? (adminDecision?.timestamp ?? null) : null;
        const rejectedAt = adminDecision?.action === "REJECTED" ? (adminDecision?.timestamp ?? null) : null;
        const rejectionReason = adminDecision?.action === "REJECTED" ? (adminDecision?.reason ?? null) : null;
        
        // Safe access to paymentSettlement fields
        const paymentMethodType = paymentSettlement?.methodType ?? null;
        const paymentLabel = paymentSettlement?.label ?? null;
        
        return {
          id: p.id,
          jobId: p.jobId,
          cleanerId: p.cleanerId,
          branchId: p.branchId,
          amount: p.cleanerAmount,
          grossAmount: p.grossAmount,
          platformFee: p.platformFee,
          currency: p.currency,
          status: p.status,
          policyVersionId: p.policyVersionId,
          createdAt: p.createdAt.toISOString(),
          paidAt: paidAtValue,
          executedAt: p.executedAt?.toISOString() ?? null,
          executionMethod: p.executionMethod ?? null,
          externalReferenceId: p.externalReferenceId ?? null,
          executionNote: p.executionNote ?? null,
          paymentMethodSnapshot: p.paymentMethodSnapshot ?? null, // Already masked
          paymentMethodType,
          paymentLabel,
          approvedAt,
          rejectedAt,
          rejectionReason,
          Cleaner: cleanerMap.get(p.cleanerId) ?? null,
          Branch: branchMap.get(p.branchId) ?? null,
          PolicyVersion: p.policyVersionId
            ? (policyMap.get(p.policyVersionId) ?? null)
            : null,
        };
      }),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[ADMIN_PAYOUTS_LIST] Error:", error);
    // Return empty list instead of throwing
    return NextResponse.json({
      success: true,
      payouts: [],
      total: 0,
      limit: 0,
      offset: 0,
    });
  }
}

