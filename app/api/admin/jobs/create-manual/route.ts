export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manual Job Creation API
 * POST /api/admin/jobs/create-manual
 *
 * Lets admins record jobs booked offline (phone, text, in person) that live
 * outside the Stripe booking flow. Creates/links a Customer by email and
 * creates a Job. Does not touch Stripe, payment, or booking logic.
 */

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { JobStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";

interface ManualJobBody {
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  clientPhone?: string;

  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;

  serviceType?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  branch?: string;

  totalAmount?: number;
  depositAmount?: number;

  cleanerName?: string;

  jobStatus?: string;
  paymentStatus?: string;

  completedAt?: string;
  completedBy?: string;
  cleanDurationMins?: number;

  internalNotes?: string;
  marketLabel?: string;
}

function isJobStatus(value: unknown): value is JobStatus {
  return (
    typeof value === "string" &&
    (Object.values(JobStatus) as string[]).includes(value)
  );
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    (Object.values(PaymentStatus) as string[]).includes(value)
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const body = (await request.json()) as ManualJobBody;

    const clientFirstName = body.clientFirstName?.trim();
    const clientEmail = body.clientEmail?.trim().toLowerCase();
    const propertyAddress = body.propertyAddress?.trim();
    const serviceType = body.serviceType?.trim();
    const branchSlug = body.branch?.trim();

    // Required fields
    if (!clientFirstName) {
      return NextResponse.json(
        { success: false, error: "clientFirstName is required" },
        { status: 400 }
      );
    }
    if (!clientEmail) {
      return NextResponse.json(
        { success: false, error: "clientEmail is required" },
        { status: 400 }
      );
    }
    if (!propertyAddress) {
      return NextResponse.json(
        { success: false, error: "propertyAddress is required" },
        { status: 400 }
      );
    }
    if (!serviceType) {
      return NextResponse.json(
        { success: false, error: "serviceType is required" },
        { status: 400 }
      );
    }
    if (!branchSlug) {
      return NextResponse.json(
        { success: false, error: "branch is required" },
        { status: 400 }
      );
    }
    if (!isJobStatus(body.jobStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid jobStatus: ${body.jobStatus}` },
        { status: 400 }
      );
    }
    if (!isPaymentStatus(body.paymentStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid paymentStatus: ${body.paymentStatus}` },
        { status: 400 }
      );
    }

    const jobStatus = body.jobStatus;
    const paymentStatus = body.paymentStatus;

    // Resolve branch by slug
    const branch = await prisma.branch.findUnique({
      where: { slug: branchSlug },
      select: { id: true, state: true },
    });
    if (!branch) {
      return NextResponse.json(
        { success: false, error: `Branch not found for slug "${branchSlug}"` },
        { status: 400 }
      );
    }

    if (auth.branchId && branch.id !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only create jobs in your assigned branch" },
        { status: 403 }
      );
    }

    // 1. Find or create the customer (match by email)
    const clientLastName = body.clientLastName?.trim() || "";
    const clientPhone = body.clientPhone?.trim() || null;

    let customer = await prisma.customer.findUnique({
      where: { email: clientEmail },
      select: { id: true },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          firstName: clientFirstName,
          lastName: clientLastName,
          email: clientEmail,
          phone: clientPhone,
          branchId: branch.id,
          updatedAt: new Date(),
        },
        select: { id: true },
      });
    }

    // 2. Build the Job record
    const totalAmount =
      typeof body.totalAmount === "number" && Number.isFinite(body.totalAmount)
        ? body.totalAmount
        : null;
    const depositAmount =
      typeof body.depositAmount === "number" &&
      Number.isFinite(body.depositAmount)
        ? body.depositAmount
        : null;

    // Derive paid / balance from the chosen payment status (manual, non-Stripe).
    let amountPaid: number | null = null;
    let balanceDue: number | null = null;
    if (totalAmount != null) {
      if (paymentStatus === PaymentStatus.PAID) {
        amountPaid = totalAmount;
        balanceDue = 0;
      } else if (paymentStatus === PaymentStatus.DEPOSIT_PAID) {
        amountPaid = depositAmount ?? 0;
        balanceDue = Math.max(totalAmount - (depositAmount ?? 0), 0);
      } else {
        amountPaid = 0;
        balanceDue = totalAmount;
      }
    }

    const preferredTime = body.scheduledStartTime?.trim()
      ? body.scheduledEndTime?.trim()
        ? `${body.scheduledStartTime.trim()} - ${body.scheduledEndTime.trim()}`
        : body.scheduledStartTime.trim()
      : null;

    let preferredDate: Date | null = null;
    if (body.scheduledDate) {
      const d = new Date(body.scheduledDate);
      if (!isNaN(d.getTime())) preferredDate = d;
    }

    const isCompleted = jobStatus === JobStatus.COMPLETED;
    let completedAt: Date | null = null;
    if (isCompleted) {
      if (body.completedAt) {
        const c = new Date(body.completedAt);
        completedAt = isNaN(c.getTime()) ? new Date() : c;
      } else {
        completedAt = new Date();
      }
    }
    const completedBy = isCompleted
      ? body.completedBy?.trim() || body.cleanerName?.trim() || null
      : null;
    const cleanDurationMins =
      isCompleted &&
      typeof body.cleanDurationMins === "number" &&
      Number.isFinite(body.cleanDurationMins) &&
      body.cleanDurationMins > 0
        ? Math.round(body.cleanDurationMins)
        : null;

    // Compose internal notes with the manual-entry marker + extras that have
    // no dedicated column (cleaner name, waived flag).
    const noteLines: string[] = ["[Source: MANUAL]"];
    if (body.cleanerName?.trim()) {
      noteLines.push(`Cleaner: ${body.cleanerName.trim()}`);
    }
    if (body.internalNotes?.trim()) {
      noteLines.push(body.internalNotes.trim());
    }
    const internalNotes = noteLines.join("\n");

    const marketLabel =
      body.marketLabel?.trim() ||
      (branchSlug === "vermont" ? "vermont" : "new-jersey");

    const customerName =
      `${clientFirstName}${clientLastName ? ` ${clientLastName}` : ""}`.trim();

    const job = await prisma.job.create({
      data: {
        id: randomUUID(),
        Branch: { connect: { id: branch.id } },
        Customer: { connect: { id: customer.id } },
        customerName,
        address: propertyAddress,
        serviceLocation: body.propertyCity?.trim() || null,
        serviceType,
        preferredDate,
        preferredTime,
        currency: "USD",
        totalPrice: totalAmount,
        quotedTotal: totalAmount,
        depositAmount,
        amountPaid,
        balanceDue,
        paymentStatus,
        status: jobStatus,
        completedAt,
        completedBy,
        cleanDurationMins,
        internalNotes,
        marketLabel,
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      customerId: customer.id,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : "Failed to create manual job";
    console.error("[create-manual job]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
