export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Send Review Requests (Cron)
 * GET /api/cron/send-review-requests
 *
 * Finds ReviewRequest records that are due (scheduledFor <= now) and not yet
 * sent (sentAt is null), emails each client a Google review request, and
 * stamps sentAt. Runs daily at 10am (see vercel.json).
 *
 * Auth: Bearer CRON_SECRET (enforced only when CRON_SECRET is set).
 * Manual test: GET with Authorization: Bearer <CRON_SECRET>.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewRequestEmail } from "@/lib/email/sendReviewRequestEmail";
import { getGoogleReviewUrl } from "@/lib/reviews/googleReviewUrl";

const MAX_PER_RUN = 200;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const due = await prisma.reviewRequest.findMany({
      where: {
        sentAt: null,
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: "asc" },
      take: MAX_PER_RUN,
    });

    if (due.length === 0) {
      return NextResponse.json({ success: true, processed: 0, sent: 0, failed: 0 });
    }

    // Resolve client names from the linked jobs in one query.
    const jobIds = Array.from(new Set(due.map((r) => r.jobId)));
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: {
        id: true,
        customerName: true,
        Customer: { select: { firstName: true, lastName: true } },
      },
    });
    const nameByJobId = new Map<string, string>();
    for (const job of jobs) {
      const name =
        job.customerName ||
        [job.Customer?.firstName, job.Customer?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "there";
      nameByJobId.set(job.id, name);
    }

    const reviewUrl = getGoogleReviewUrl();

    let sent = 0;
    let failed = 0;

    for (const req of due) {
      const result = await sendReviewRequestEmail({
        toEmail: req.clientEmail,
        toName: nameByJobId.get(req.jobId) || "there",
        reviewUrl,
      });

      if (result.sent) {
        await prisma.reviewRequest.update({
          where: { id: req.id },
          data: { sentAt: new Date() },
        });
        sent++;
      } else {
        console.error(
          `[send-review-requests] Failed for ${req.clientEmail}:`,
          result.error || result.skippedReason
        );
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: due.length,
      sent,
      failed,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send review requests";
    console.error("[send-review-requests]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Support POST for cron services that prefer POST.
export async function POST(request: NextRequest) {
  return GET(request);
}
