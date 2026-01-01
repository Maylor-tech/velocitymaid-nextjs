import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logPaymentMethodAction } from "@/lib/payoutDecryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/payment-methods/[id]/verify
 * Approve or reject a payment method
 * 
 * Body: {
 *   "action": "approve" | "reject",
 *   "note": "Optional reason"
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = req.headers.get("x-admin-id");
    
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify admin user exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId, role: "ADMIN" },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, note } = body;

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
            verifiedAt: new Date(),
            verifiedBy: adminId,
            isActive: true,
            verificationNote: note || null,
            updatedAt: new Date(),
          }
        : {
            isActive: false,
            verifiedAt: null,
            verifiedBy: null, // Clear verifiedBy on reject
            verificationNote: note || "Rejected by admin",
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
        verifiedAt: true,
        verifiedBy: true,
        verificationNote: true,
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
  } catch (e: any) {
    console.error("[ADMIN_PAYMENT_METHODS_VERIFY] Error:", e);
    return NextResponse.json(
      { success: false, error: e.message ?? "Failed to verify payment method" },
      { status: 400 }
    );
  }
}

