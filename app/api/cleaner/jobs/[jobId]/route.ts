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
import { toCleanerCompensationView } from "@/lib/dispatch/compensation";
import { assertNoCustomerFinancials } from "@/lib/dispatch/cleanerFinancialGuard";

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
        submittedForQcAt: true,
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
      const offer = serializeCleanerOffer({
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
      });
      const body = {
        success: true,
        access: "OFFER",
        offer,
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
          compensation: offer.compensation,
          compensationAmount: offer.compensationAmount,
          compensationCurrency: offer.compensationCurrency,
          compensationBasis: offer.compensationBasis,
          operationalNotes: openOffer.operationalNotes,
          Branch: job.Branch,
        },
      };
      assertNoCustomerFinancials(body, "cleaner offer GET");
      return NextResponse.json(body);
    }

    const acceptedOffer =
      offerRow?.status === JobOfferStatus.ACCEPTED ? offerRow : null;
    const compensation = acceptedOffer
      ? toCleanerCompensationView({
          amount: acceptedOffer.compensationAmount,
          currency: acceptedOffer.compensationCurrency,
          basis: acceptedOffer.compensationBasis,
        })
      : null;

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
      submittedForQcAt: job.submittedForQcAt?.toISOString() ?? null,
      cleanDurationMins: job.cleanDurationMins,
      estimatedDurationMins: job.estimatedDurationMins,
      jobSpecificNotes: job.internalNotes,
      propertyId: job.propertyId,
      property: job.Property ? toCleanerPropertyView(job.Property) : null,
      compensation,
      compensationAmount: compensation?.amount ?? null,
      compensationCurrency: compensation?.currency ?? null,
      compensationBasis: compensation?.basis ?? null,
      Customer: job.Customer,
      Branch: job.Branch,
    };

    const body = {
      success: true,
      access: "ASSIGNED",
      job: formattedJob,
    };
    assertNoCustomerFinancials(body, "cleaner assigned GET");
    return NextResponse.json(body);
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
