export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Send Review Requests (Cron)
 * GET /api/cron/send-review-requests
 *
 * Finds due ReviewRequest rows, claims each one, then emails the client.
 * A second worker cannot claim the same row. Provider acceptance is recorded
 * with the message id. If that write fails, the claim stays and is not retried
 * as a fresh send. Runs daily at 10am (see vercel.json).
 *
 * Auth: Bearer CRON_SECRET. A missing or empty secret rejects the request.
 * Manual test: GET with Authorization: Bearer <CRON_SECRET>.
 *
 * Google review URL is resolved per job branch (Vermont vs New Jersey).
 * Unresolved branch or missing env fails that row safely — never guesses market.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron/verifyCronAuth";
import { prisma } from "@/lib/prisma";
import {
  GoogleReviewUrlError,
  requireGoogleReviewUrl,
} from "@/lib/reviews/googleReviewUrl";
import {
  claimableReviewRequestWhere,
  deliverClaimedReviewRequest,
} from "@/lib/reviews/reviewRequestClaim";

const MAX_PER_RUN = 200;

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const now = new Date();
    const due = await prisma.reviewRequest.findMany({
      where: claimableReviewRequestWhere(now),
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
        unknown: 0,
        acceptedUnrecorded: 0,
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
    let unknown = 0;
    let acceptedUnrecorded = 0;
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

      const outcome = await deliverClaimedReviewRequest({
        id: req.id,
        toEmail: req.clientEmail,
        toName,
        reviewUrl,
        now,
      });

      if (outcome === "sent") sent++;
      else if (outcome === "not_claimed") skipped++;
      else if (outcome === "unknown") unknown++;
      else if (outcome === "accepted_unrecorded") acceptedUnrecorded++;
      else if (outcome === "skipped") skipped++;
      else failed++;
    }

    return NextResponse.json({
      success: true,
      processed: due.length,
      sent,
      failed,
      skipped,
      unknown,
      acceptedUnrecorded,
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
