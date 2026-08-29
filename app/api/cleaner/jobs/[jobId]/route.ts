/**
 * GET /api/cleaner/jobs/[jobId]
 *
 * Assigned cleaner: full work order (property access after accept).
 * Outstanding offer: general location + compensation; no access credentials
 * and no customer invoice totals.
 */

import { NextRequest, NextResponse } from "next/server";
import { JobOfferStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { toCleanerPropertyView } from "@/lib/properties/propertyService";
import { toCleanerOfferLocationView } from "@/lib/dispatch/cleanerViews";
import { serializeCleanerOffer } from "@/lib/dispatch/serializeCleanerOffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(req, "CLEANER");

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        customerName: true,
        serviceType: true,
        serviceLocation: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        currency: true,
        assignedAt: true,
        assignedCleanerId: true,
        onTheWayAt: true,
        startedAt: true,
        completedAt: true,
        cleanDurationMins: true,
        estimatedDurationMins: true,
        internalNotes: true,
        propertyId: true,
        jobReference: true,
        Branch: {
          select: { id: true, name: true },
        },
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        Property: true,
        JobOffer: {
          where: {
            cleanerId: auth.userId,
            status: { in: [JobOfferStatus.OFFERED, JobOfferStatus.ACCEPTED] },
          },
          orderBy: { offeredAt: "desc" },
          take: 1,
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const assigned = job.assignedCleanerId === auth.userId;
    const offerRow = job.JobOffer[0] ?? null;
    const openOffer =
      offerRow &&
      offerRow.status === JobOfferStatus.OFFERED &&
      offerRow.expiresAt.getTime() > Date.now()
        ? offerRow
        : null;

    if (!assigned && !openOffer) {
      return NextResponse.json(
        {
          success: false,
          error: "This job is not assigned to your cleaner account.",
        },
        { status: 403 }
      );
    }

    if (!assigned && openOffer) {
      return NextResponse.json({
        success: true,
        access: "OFFER",
        offer: serializeCleanerOffer({
          ...openOffer,
          Job: {
            jobReference: job.jobReference,
            serviceType: job.serviceType,
            preferredDate: job.preferredDate,
            preferredTime: job.preferredTime,
            serviceLocation: job.serviceLocation,
            Property: job.Property
              ? { city: job.Property.city, state: job.Property.state }
              : null,
          },
        }),
        job: {
          id: job.id,
          status: job.status,
          jobReference: job.jobReference,
          serviceType: job.serviceType,
          preferredDate: job.preferredDate?.toISOString() ?? null,
          preferredTime: job.preferredTime,
          location: toCleanerOfferLocationView({
            serviceLocation: job.serviceLocation,
            property: job.Property,
          }),
          estimatedDurationMins: openOffer.estimatedDurationMins,
          compensationAmount: Number(openOffer.compensationAmount),
          compensationCurrency: openOffer.compensationCurrency,
          operationalNotes: openOffer.operationalNotes,
          Branch: job.Branch,
        },
      });
    }

    const acceptedOffer =
      offerRow?.status === JobOfferStatus.ACCEPTED ? offerRow : null;

    const formattedJob = {
      id: job.id,
      status: job.status,
      jobReference: job.jobReference,
      customerName: job.customerName,
      serviceType: job.serviceType,
      serviceLocation: job.serviceLocation,
      preferredDate: job.preferredDate?.toISOString() ?? null,
      preferredTime: job.preferredTime,
      address: job.address,
      currency: job.currency,
      assignedAt: job.assignedAt?.toISOString() ?? null,
      assignedCleanerId: job.assignedCleanerId,
      onTheWayAt: job.onTheWayAt?.toISOString() ?? null,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      cleanDurationMins: job.cleanDurationMins,
      estimatedDurationMins: job.estimatedDurationMins,
      jobSpecificNotes: job.internalNotes,
      propertyId: job.propertyId,
      property: job.Property ? toCleanerPropertyView(job.Property) : null,
      compensationAmount: acceptedOffer
        ? Number(acceptedOffer.compensationAmount)
        : null,
      compensationCurrency: acceptedOffer?.compensationCurrency ?? null,
      Customer: job.Customer,
      Branch: job.Branch,
    };

    return NextResponse.json({
      success: true,
      access: "ASSIGNED",
      job: formattedJob,
    });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error("[CLEANER_JOB]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch job",
      },
      { status: 500 }
    );
  }
}
