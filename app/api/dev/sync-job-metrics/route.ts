export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (process.env.APP_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Not allowed in production" },
      { status: 403 }
    );
  }

  try {
    const jobs = await prisma.job.findMany({
      select: {
        id: true,
        status: true,
        jobQualityScore: true,
      },
    });

    let jobsUpdated = 0;

    for (const job of jobs) {
      const rating = await prisma.cleanerRating.findUnique({
        where: { jobId: job.id },
        select: { rating: true },
      });

      if (rating) {
        const score = rating.rating * 20; // Simple mapping: 5 stars -> 100
        if (job.jobQualityScore !== score) {
          await prisma.job.update({
            where: { id: job.id },
            data: {
              jobQualityScore: score,
              completedAt: job.status === "completed" ? new Date() : undefined,
            },
          });
          jobsUpdated += 1;
        }
      }
    }

    return NextResponse.json({ success: true, jobsUpdated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}

















