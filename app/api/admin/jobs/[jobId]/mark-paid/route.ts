export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manually record a job payment — admin protected.
 *
 * POST /api/admin/jobs/[jobId]/mark-paid
 * Body: { amount: number, method: string, reference?: string }
 *
 * Used when payment is collected outside Stripe (PayPal, cash, etc.). Sets the
 * job's paymentStatus to PAID, records amount + method + reference, zeroes the
 * balance, and stamps paidAt. Does NOT touch Stripe or the cleaner payout flow.
 *
 * Only allowed when the current paymentStatus is PENDING or DEPOSIT_PAID.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";

const ALLOWED_METHODS = ["PayPal", "Cash", "Stripe", "Other"];
const ALLOWED_FROM_STATUS = ["PENDING", "DEPOSIT_PAID"];

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, "ADMIN");
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawAmount = body?.amount;
    const method = typeof body?.method === "string" ? body.method.trim() : "";
    const reference =
      typeof body?.reference === "string" && body.reference.trim()
        ? body.reference.trim()
        : null;

    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid amount greater than 0 is required" },
        { status: 400 }
      );
    }
    if (!ALLOWED_METHODS.includes(method)) {
      return NextResponse.json(
        { success: false, error: "A valid payment method is required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, paymentStatus: true, currency: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (!ALLOWED_FROM_STATUS.includes(job.paymentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot mark paid from status ${job.paymentStatus}`,
        },
        { status: 409 }
      );
    }

    const paidAt = new Date();
    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        paymentStatus: "PAID",
        amountPaid: amount,
        balanceDue: 0,
        paymentMethod: method,
        paymentReference: reference,
        paidAt,
      },
      select: {
        id: true,
        paymentStatus: true,
        amountPaid: true,
        balanceDue: true,
        paymentMethod: true,
        paymentReference: true,
        paidAt: true,
        currency: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ${formatAmount(amount, updated.currency)} recorded via ${method}`,
      job: {
        id: updated.id,
        paymentStatus: updated.paymentStatus,
        amountPaid: updated.amountPaid != null ? Number(updated.amountPaid) : null,
        balanceDue: updated.balanceDue != null ? Number(updated.balanceDue) : null,
        paymentMethod: updated.paymentMethod,
        paymentReference: updated.paymentReference,
        paidAt: updated.paidAt?.toISOString() || null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : "Failed to record payment";
    console.error("[job mark-paid]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function formatAmount(amount: number, currency: string | null) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
