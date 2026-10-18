import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { loadJobPhotoChecklist } from "@/lib/photos/jobPhotoChecklist";
import { submitJobForQc } from "@/lib/jobs/submitJobForQc";
import { nextReportNumber } from "@/lib/billing/numbering";
import { sendJobReportLinkEmail } from "@/lib/email/sendJobReportLinkEmail";
import type { ReportPhoto } from "@/lib/billing/serializeCompletionReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function photosForCategory(
  checklist: NonNullable<Awaited<ReturnType<typeof loadJobPhotoChecklist>>>,
  category: "BEFORE" | "AFTER" | "ISSUE"
): ReportPhoto[] {
  return checklist.photos
    .filter((photo) => photo.category === category)
    .map((photo) => {
      const slotLabel =
        checklist.slots.find((slot) => slot.key === photo.slotKey)?.label ?? null;
      return {
        url: photo.url,
        caption: slotLabel || photo.caption,
        slotLabel,
        category,
      };
    });
}

async function loadReview(jobId: string) {
  const checklist = await loadJobPhotoChecklist(jobId);
  if (!checklist) return null;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      status: true,
      address: true,
      Customer: { select: { email: true, firstName: true, lastName: true } },
      CompletionReport: {
        select: { id: true, status: true, publicToken: true, sentAt: true, reportNumber: true },
      },
      Invoice: { select: { publicToken: true } },
    },
  });
  if (!job) return null;
  return { checklist, job };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(req, "ADMIN");
    const review = await loadReview(params.jobId);
    if (!review) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      status: review.job.status,
      address: review.job.address,
      customerEmail: review.job.Customer?.email ?? null,
      checklist: review.checklist,
      report: review.job.CompletionReport,
      invoicePublicToken: review.job.Invoice?.publicToken ?? null,
    });
  } catch (err: unknown) {
    const auth = rethrowIfAuthResponse(err);
    if (auth) return auth;
    const message = err instanceof Error ? err.message : "Failed to load photo review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const admin = await requireRole(req, "ADMIN");
    const jobId = params.jobId;
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "override-finish") {
      const result = await submitJobForQc({
        jobId,
        actorId: admin.userId,
        actorRole: "ADMIN",
      });
      if (result.kind === "missing") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      if (result.kind === "not-in-progress") {
        return NextResponse.json(
          { error: `Job cannot be finished from status ${result.status}` },
          { status: 400 }
        );
      }
      if (result.kind === "payment-changed" || result.kind === "completed-forbidden") {
        return NextResponse.json({ error: "Override must not change payment or completion" }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        submittedForQc: true,
        job: result.job,
        message: result.kind === "already" ? result.message : "Submitted for QC with admin override.",
      });
    }

    if (action === "retake") {
      const photoId = String(body.photoId || "");
      const photo = await prisma.cleanPhoto.findFirst({
        where: { id: photoId, jobId },
        select: { id: true },
      });
      if (!photo) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }
      await prisma.cleanPhoto.update({
        where: { id: photo.id },
        data: { slotKey: null, caption: "Retake requested" },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "approve") {
      const review = await loadReview(jobId);
      if (!review) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      const reportNumber =
        review.job.CompletionReport?.reportNumber ?? (await nextReportNumber());
      const report = await prisma.completionReport.upsert({
        where: { jobId },
        create: {
          jobId,
          reportNumber,
          propertyAddress: review.job.address || "Property on file",
          serviceDate: new Date(),
          teamSummary: null,
          beforePhotos: photosForCategory(review.checklist, "BEFORE"),
          afterPhotos: photosForCategory(review.checklist, "AFTER"),
          issuesFound:
            review.checklist.arrivalCondition === "ISSUES"
              ? photosForCategory(review.checklist, "ISSUE")
                  .map((photo) => photo.caption || photo.slotLabel || "Issue photo")
                  .join("\n") || "Arrival condition: Issues"
              : null,
          status: "GENERATED",
        },
        update: {
          propertyAddress: review.job.address || "Property on file",
          beforePhotos: photosForCategory(review.checklist, "BEFORE"),
          afterPhotos: photosForCategory(review.checklist, "AFTER"),
          updatedAt: new Date(),
          ...(review.job.CompletionReport?.status === "SENT" ? {} : { status: "GENERATED" }),
        },
        select: { id: true, publicToken: true, status: true, reportNumber: true },
      });
      return NextResponse.json({ success: true, report });
    }

    if (action === "send") {
      const review = await loadReview(jobId);
      if (!review?.job.CompletionReport) {
        return NextResponse.json(
          { error: "Approve the report before sending it" },
          { status: 400 }
        );
      }
      const email = review.job.Customer?.email?.trim();
      if (!email) {
        return NextResponse.json({ error: "Customer has no email" }, { status: 400 });
      }
      const clientName = [review.job.Customer?.firstName, review.job.Customer?.lastName]
        .filter(Boolean)
        .join(" ");
      const sent = await sendJobReportLinkEmail({
        toEmail: email,
        clientName,
        reportToken: review.job.CompletionReport.publicToken,
        propertyAddress: review.job.address || "Property on file",
        invoicePublicToken: review.job.Invoice?.publicToken ?? null,
      });
      if (!sent.sent) {
        return NextResponse.json(
          { error: sent.skippedReason || "Email was not sent", sent: false },
          { status: 502 }
        );
      }
      const report = await prisma.completionReport.update({
        where: { id: review.job.CompletionReport.id },
        data: { status: "SENT", sentAt: new Date() },
        select: { status: true, publicToken: true, sentAt: true },
      });
      return NextResponse.json({ success: true, sent: true, report });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const auth = rethrowIfAuthResponse(err);
    if (auth) return auth;
    const message = err instanceof Error ? err.message : "Photo review failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
