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
 *
 * Google review URL is resolved per job branch (Vermont vs New Jersey).
 * Unresolved branch or missing env fails that row safely — never guesses market.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewRequestEmail } from "@/lib/email/sendReviewRequestEmail";
import {
  GoogleReviewUrlError,
  requireGoogleReviewUrl,
} from "@/lib/reviews/googleReviewUrl";

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
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
      });
    }

    const jobIds = Array.from(new Set(due.map((r) => r.jobId)));
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: {
        id: true,
        customerName: true,
        serviceLocation: true,
        Customer: { select: { firstName: true, lastName: true } },
        Branch: { select: { slug: true } },
      },
    });
    const jobById = new Map(jobs.map((j) => [j.id, j]));

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const errors: Array<{ jobId: string; email: string; reason: string }> = [];

    for (const req of due) {
      const job = jobById.get(req.jobId);
      const toName =
        job?.Customer?.firstName ||
        job?.customerName ||
        [job?.Customer?.firstName, job?.Customer?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "there";

      let reviewUrl: string;
      try {
        ({ url: reviewUrl } = requireGoogleReviewUrl({
          branchSlug: job?.Branch?.slug ?? null,
          serviceLocation: job?.serviceLocation ?? null,
          jobId: req.jobId,
        }));
      } catch (err) {
        const reason =
          err instanceof GoogleReviewUrlError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Google review URL resolution failed";
        console.error(
          `[send-review-requests] Skipping Google review for ${req.clientEmail}:`,
          reason
        );
        errors.push({ jobId: req.jobId, email: req.clientEmail, reason });
        skipped++;
        continue;
      }

      const result = await sendReviewRequestEmail({
        toEmail: req.clientEmail,
        toName,
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
      skipped,
      errors: errors.length ? errors : undefined,
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
