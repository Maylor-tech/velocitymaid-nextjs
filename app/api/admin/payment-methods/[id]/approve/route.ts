import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    const adminId = auth.userId;

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
    if (e instanceof NextResponse) return e;
    return NextResponse.json(
      { success: false, error: e.message ?? "Failed" },
      { status: 400 }
    );
  }
}
