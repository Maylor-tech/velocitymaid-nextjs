import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { logPaymentMethodAction } from "@/lib/payoutDecryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/payment-methods/[id]/verify
 * Approve or reject a payment method
 * 
 * Body: {
 *   "action": "approve" | "reject"
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    const adminId = auth.userId;

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Check if method exists
    const method = await prisma.cleanerPaymentMethod.findUnique({
      where: { id: params.id },
    });

    if (!method) {
      return NextResponse.json(
        { success: false, error: "Payment method not found" },
        { status: 404 }
      );
    }

    const update =
      action === "approve"
        ? {
            isActive: true,
            updatedAt: new Date(),
          }
        : {
            isActive: false,
            updatedAt: new Date(),
          };

    const updated = await prisma.cleanerPaymentMethod.update({
      where: { id: params.id },
      data: update,
      select: {
        id: true,
        cleanerId: true,
        methodType: true,
        isActive: true,
      },
    });

    // Safe logging - never log sensitive payment data
    logPaymentMethodAction(action, {
      cleanerId: updated.cleanerId,
      methodId: updated.id,
      methodType: updated.methodType,
      adminId: adminId,
    });

    return NextResponse.json({ 
      success: true, 
      method: updated,
      message: action === "approve" 
        ? "Payment method approved successfully" 
        : "Payment method rejected",
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error("[ADMIN_PAYMENT_METHODS_VERIFY] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to verify payment method";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

