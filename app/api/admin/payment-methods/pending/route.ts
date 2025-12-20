import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { maskPaymentDetails } from "@/lib/paymentMasking";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    const pending = await prisma.cleanerPaymentMethod.findMany({
      where: { 
        isActive: false, 
        verifiedAt: null 
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
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message ?? "Failed" },
      { status: 401 }
    );
  }
}
