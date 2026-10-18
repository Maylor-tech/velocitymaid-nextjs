import { NextRequest, NextResponse } from "next/server";
import { ArrivalCondition } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH /api/cleaner/jobs/[jobId]/arrival — Normal or Issues after Start Job. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    await requireCleanerJobAssignment(req, jobId);
    const body = await req.json();
    const arrival = body.arrivalCondition;
    if (arrival !== ArrivalCondition.NORMAL && arrival !== ArrivalCondition.ISSUES) {
      return NextResponse.json(
        { error: "arrivalCondition must be NORMAL or ISSUES" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { status: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Arrival can be set only after Start Job" },
        { status: 400 }
      );
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { arrivalCondition: arrival },
      select: { id: true, arrivalCondition: true },
    });

    return NextResponse.json({ success: true, job: updated });
  } catch (err: unknown) {
    const authResp = rethrowIfAuthResponse(err);
    if (authResp) return authResp;
    const message = err instanceof Error ? err.message : "Failed to save arrival";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
