export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCleanerLevel } from "@/lib/cleaner-level";

export async function POST(request: NextRequest) {
  if (process.env.APP_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Not allowed in production" },
      { status: 403 }
    );
  }

  try {
    const cleaners = await prisma.user.findMany({
      where: { role: "CLEANER" },
      select: {
        id: true,
        name: true,
        email: true,
        warningCount: true,
        isSuspended: true,
      },
    });

    let updated = 0;

    for (const cleaner of cleaners) {
      const level = calculateCleanerLevel({
        warningCount: cleaner.warningCount,
        isSuspended: cleaner.isSuspended,
        // Additional metrics can be added as needed
      } as any);

      // No dedicated level field in schema; just bump updatedAt to reflect recalculation
      await prisma.user.update({
        where: { id: cleaner.id },
        data: {
          updatedAt: new Date(),
        },
      });
      updated += 1;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Recalculation failed" },
      { status: 500 }
    );
  }
}








