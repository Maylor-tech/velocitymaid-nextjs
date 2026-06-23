export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mark Clean Complete + Notify Client API
 * POST /api/jobs/[jobId]/complete
 *
 * Internal-only (admin) endpoint. Records completion details on the job and,
 * unless disabled, emails the client a clean summary with photos and a
 * payment link via Resend.
 */

import { NextRequest, NextResponse } from "next/server";
import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";
import { sendCleanCompleteEmail } from "@/lib/email/sendCleanCompleteEmail";

interface CompleteBody {
  completedBy?: string;
  cleanDurationMins?: number;
  internalNotes?: string;
  sendNotification?: boolean;
}

type Market = "vermont" | "new-jersey";

function resolveMarket(marketLabel: string | null, state: string | null): Market {
  const label = (marketLabel || "").toLowerCase();
  if (label === "vermont" || label === "new-jersey") return label;
  const s = (state || "").toUpperCase();
  if (s === "VT" || s === "VERMONT") return "vermont";
  return "new-jersey";
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const { jobId } = params;
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    let body: CompleteBody = {};
    try {
      body = (await request.json()) as CompleteBody;
    } catch {
      body = {};
    }

    const completedBy = body.completedBy?.trim();
    if (!completedBy) {
      return NextResponse.json(
        { success: false, error: "completedBy is required" },
        { status: 400 }
      );
    }

    const sendNotification = body.sendNotification !== false; // default true

    const cleanDurationMins =
      typeof body.cleanDurationMins === "number" &&
      Number.isFinite(body.cleanDurationMins) &&
      body.cleanDurationMins > 0
        ? Math.round(body.cleanDurationMins)
        : null;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        branchId: true,
        address: true,
        customerName: true,
        balanceDue: true,
        marketLabel: true,
        Customer: {
          select: { firstName: true, lastName: true, email: true },
        },
        Branch: { select: { state: true } },
        photos: {
          select: { url: true, caption: true },
          orderBy: { uploadedAt: "asc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Look up by job ID only — an admin with the job ID may complete it
    // regardless of which branch their session is scoped to.

    const completedAt = new Date();

    await prisma.job.update({
      where: { id: jobId },
      data: {
        completedAt,
        completedBy,
        cleanDurationMins,
        internalNotes: body.internalNotes?.trim() || null,
        status: JobStatus.COMPLETED,
      },
    });

    let notifiedAt: Date | null = null;
    let emailResult: { sent: boolean; error?: string; skippedReason?: string } | null =
      null;

    if (sendNotification) {
      const toEmail = job.Customer?.email || "";
      const toName =
        job.customerName ||
        [job.Customer?.firstName, job.Customer?.lastName]
          .filter(Boolean)
          .join(" ") ||
        "there";
      const propertyAddress = job.address || "your property";
      const balanceDue =
        job.balanceDue != null ? Number(job.balanceDue) : null;
      const invoiceAmount =
        balanceDue != null && balanceDue > 0 ? balanceDue : undefined;
      const market = resolveMarket(job.marketLabel, job.Branch?.state ?? null);
      const paypalEmail =
        process.env.PAYPAL_EMAIL || "hello@velocitymaid.com";

      if (!toEmail) {
        emailResult = {
          sent: false,
          skippedReason: "No client email on file",
        };
      } else {
        emailResult = await sendCleanCompleteEmail({
          toEmail,
          toName,
          propertyAddress,
          cleanDate: completedAt,
          cleanDurationMins: cleanDurationMins ?? undefined,
          photos: job.photos.map((p) => ({
            url: p.url,
            caption: p.caption ?? undefined,
          })),
          invoiceAmount,
          paypalEmail,
          market,
        });

        if (emailResult.sent) {
          notifiedAt = new Date();
          await prisma.job.update({
            where: { id: jobId },
            data: { notifiedAt },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      notifiedAt: notifiedAt ? notifiedAt.toISOString() : null,
      email: emailResult,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : "Failed to mark job complete";
    console.error("[job complete]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
