import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const note = typeof body?.note === "string" ? body.note.trim() : null;

    const updated = await prisma.cleanerPaymentMethod.update({
      where: { id: params.id },
      data: {
        isActive: true, // Activate upon approval
        verifiedAt: new Date(),
        verifiedBy: adminId,
        verificationNote: note,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        cleanerId: true,
        isActive: true,
        verifiedAt: true,
        verifiedBy: true,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message ?? "Failed" },
      { status: 400 }
    );
  }
}
