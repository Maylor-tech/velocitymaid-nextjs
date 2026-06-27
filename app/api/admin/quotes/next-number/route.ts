export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { buildQuoteNumberFromSequence } from "@/lib/admin/quoteDefaults";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const jobCount = await prisma.job.count();
    const quoteNumber = buildQuoteNumberFromSequence(1043 + jobCount);

    return NextResponse.json({
      success: true,
      quoteNumber,
    });
  } catch (error: unknown) {
    console.error("[admin/quotes/next-number]", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate quote number";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
