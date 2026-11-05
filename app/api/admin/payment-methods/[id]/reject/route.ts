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

    const updated = await prisma.cleanerPaymentMethod.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        cleanerId: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
