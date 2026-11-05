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
    await requireRole(req, "ADMIN");
    const body = await req.json().catch(() => ({}));
    const note =
      typeof body?.note === "string" ? body.note.trim() : "Rejected by admin";

    const updated = await prisma.cleanerPaymentMethod.update({
      where: { id: params.id },
      data: {
        isActive: false,
        verifiedAt: null,
        verifiedBy: null, // Clear verifiedBy on reject
        verificationNote: note,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        cleanerId: true,
        isActive: true,
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
