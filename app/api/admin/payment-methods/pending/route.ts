import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { maskPaymentDetails } from "@/lib/paymentMasking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");

    const pending = await prisma.cleanerPaymentMethod.findMany({
      where: {
        isActive: false,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        cleanerId: true,
        methodType: true,
        details: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Mask all sensitive data - admins never see full values
    const maskedPending = pending.map((method) => ({
      ...method,
      details: maskPaymentDetails(method.details, method.methodType),
    }));

    return NextResponse.json({ success: true, pending: maskedPending });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
