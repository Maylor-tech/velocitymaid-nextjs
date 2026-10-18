export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manual Job Creation API
 * POST /api/admin/jobs/create-manual
 * GET  /api/admin/jobs/create-manual?propertyId&scheduledDate&customerId
 *
 * Existing customers are selected by id. Their master address and branch are
 * not rewritten. A saved agreed price is a customer-facing amount and is not
 * grossed up. Jobs are created as RECEIVED with no cleaner assignment.
 *
 * priceInputMode (ADMIN-ONLY):
 * - 'operational': totalAmount is the payout base; protection may raise the
 *   customer total when enabled.
 * - 'customer': totalAmount is the final customer price. No gross-up.
 *   Public booking/checkout APIs do not accept this field.
 */

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { JobStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";
import { geocodeCustomerInBackground } from "@/lib/geocoding/geocodeCustomer";
import { nextVmReference } from "@/lib/billing/numbering";
import { awaitJobGoogleSync } from "@/lib/google/jobGoogleSync";
import { protectOperationalPrice } from "@/lib/pricing/processingPolicy";
import { resolveBillingPolicy } from "@/lib/billing/billingPolicy";
import { logAuditEntry } from "@/lib/audit";
import { parseServiceDateInput } from "@/lib/dates/serviceDate";
import {
  guestDatesForCategory,
  isServiceCategory,
  priceWasOverridden,
  resolveManualJobPrice,
  type ServiceCategory,
} from "@/lib/admin/manualJobCreate";

interface ManualJobBody {
  customerMode?: "existing" | "new";
  customerId?: string;
  propertyId?: string;

  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  clientPhone?: string;

  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;

  serviceCategory?: string;
  serviceType?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  guestCheckInDate?: string | null;
  guestCheckOutDate?: string | null;
  branch?: string;

  totalAmount?: number;
  operationalAmount?: number | null;
  priceInputMode?: "operational" | "customer";
  depositAmount?: number;

  jobStatus?: string;
  paymentStatus?: string;
  cleanerName?: string;

  internalNotes?: string;
  marketLabel?: string;
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    (Object.values(PaymentStatus) as string[]).includes(value)
  );
}

function moneyOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function readStayDate(value: unknown): Date | null | "invalid" {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "invalid";
  return parseServiceDateInput(value) ?? "invalid";
}

async function sameDayJobs(propertyId: string, preferredDate: Date) {
  const end = new Date(preferredDate.getTime() + 24 * 60 * 60 * 1000);
  return prisma.job.findMany({
    where: {
      propertyId,
      preferredDate: { gte: preferredDate, lt: end },
      status: { notIn: [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY] },
    },
    select: {
      id: true,
      jobReference: true,
      status: true,
      serviceType: true,
      preferredDate: true,
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const propertyId = request.nextUrl.searchParams.get("propertyId")?.trim();
    const scheduledDate = request.nextUrl.searchParams.get("scheduledDate")?.trim();
    const customerId = request.nextUrl.searchParams.get("customerId")?.trim();
    if (!propertyId || !scheduledDate) {
      return NextResponse.json(
        { success: false, error: "propertyId and scheduledDate are required" },
        { status: 400 }
      );
    }
    const preferredDate = parseServiceDateInput(scheduledDate);
    if (!preferredDate) {
      return NextResponse.json(
        { success: false, error: "scheduledDate is invalid" },
        { status: 400 }
      );
    }
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, customerId: true },
    });
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }
    if (customerId && property.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Property does not belong to this customer" },
        { status: 400 }
      );
    }
    const jobs = await sameDayJobs(property.id, preferredDate);
    return NextResponse.json({
      success: true,
      sameDayJobs: jobs.map((job) => ({
        id: job.id,
        jobReference: job.jobReference,
        status: job.status,
        serviceType: job.serviceType,
        preferredDate: job.preferredDate?.toISOString() ?? null,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : "Failed to check existing jobs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const body = (await request.json()) as ManualJobBody;

    if (body.jobStatus && body.jobStatus !== JobStatus.RECEIVED) {
      return NextResponse.json(
        {
          success: false,
          error: "Manual jobs are created as Received. Assign a cleaner from the job page.",
        },
        { status: 400 }
      );
    }
    if (!isPaymentStatus(body.paymentStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid paymentStatus: ${body.paymentStatus}` },
        { status: 400 }
      );
    }
    if (!isServiceCategory(body.serviceCategory)) {
      return NextResponse.json(
        { success: false, error: "serviceCategory must be RESIDENTIAL or VACATION_RENTAL" },
        { status: 400 }
      );
    }

    const clientFirstName = body.clientFirstName?.trim();
    const clientEmail = body.clientEmail?.trim().toLowerCase();
    const propertyAddress = body.propertyAddress?.trim();
    const serviceType = body.serviceType?.trim();
    const branchSlug = body.branch?.trim();
    const serviceCategory = body.serviceCategory;
    const customerMode = body.customerMode === "existing" ? "existing" : "new";
    const priceMode = body.priceInputMode === "customer" ? "customer" : "operational";

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
    if (!body.scheduledDate?.trim()) {
      return NextResponse.json(
        { success: false, error: "scheduledDate is required" },
        { status: 400 }
      );
    }
    const preferredDate = parseServiceDateInput(body.scheduledDate);
    if (!preferredDate) {
      return NextResponse.json(
        { success: false, error: "scheduledDate is invalid" },
        { status: 400 }
      );
    }

    const totalAmount = moneyOrNull(body.totalAmount);
    if (totalAmount == null || totalAmount < 0) {
      return NextResponse.json(
        { success: false, error: "totalAmount is required" },
        { status: 400 }
      );
    }
    const operationalAmount = moneyOrNull(body.operationalAmount);
    if (body.operationalAmount != null && operationalAmount == null) {
      return NextResponse.json(
        { success: false, error: "operationalAmount is invalid" },
        { status: 400 }
      );
    }

    const checkIn = readStayDate(body.guestCheckInDate);
    const checkOut = readStayDate(body.guestCheckOutDate);
    if (checkIn === "invalid" || checkOut === "invalid") {
      return NextResponse.json(
        { success: false, error: "Guest check-in or checkout date is invalid" },
        { status: 400 }
      );
    }
    const stayDates = guestDatesForCategory(
      serviceCategory as ServiceCategory,
      checkIn,
      checkOut
    );

    const clientLastName = body.clientLastName?.trim() || "";
    const clientPhone = body.clientPhone?.trim() || null;
    const propertyCity = body.propertyCity?.trim() || null;
    const propertyState = body.propertyState?.trim() || null;

    let customerId: string;
    let customerBilling: string | null = null;
    let jobFirstName = clientFirstName;
    let jobLastName = clientLastName;
    let branch: { id: string; state: string | null; slug: string | null };

    if (customerMode === "existing") {
      const requestedId = body.customerId?.trim();
      if (!requestedId) {
        return NextResponse.json(
          { success: false, error: "customerId is required for an existing customer" },
          { status: 400 }
        );
      }
      const existing = await prisma.customer.findUnique({
        where: { id: requestedId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          billingPolicy: true,
          branchId: true,
          Branch: { select: { id: true, state: true, slug: true } },
        },
      });
      if (!existing) {
        return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
      }
      const storedEmail = existing.email.trim().toLowerCase();
      if (clientEmail !== storedEmail) {
        return NextResponse.json(
          {
            success: false,
            error: "Email does not match the selected customer. Choose that customer again.",
          },
          { status: 400 }
        );
      }
      customerId = existing.id;
      customerBilling = existing.billingPolicy;
      jobFirstName = existing.firstName;
      jobLastName = existing.lastName.trim();
      if (existing.Branch) {
        branch = {
          id: existing.Branch.id,
          state: existing.Branch.state,
          slug: existing.Branch.slug,
        };
      } else {
        if (!branchSlug) {
          return NextResponse.json(
            { success: false, error: "branch is required" },
            { status: 400 }
          );
        }
        const resolved = await prisma.branch.findUnique({
          where: { slug: branchSlug },
          select: { id: true, state: true, slug: true },
        });
        if (!resolved) {
          return NextResponse.json(
            { success: false, error: `Branch not found for slug "${branchSlug}"` },
            { status: 400 }
          );
        }
        branch = resolved;
      }
    } else {
      if (!branchSlug) {
        return NextResponse.json(
          { success: false, error: "branch is required" },
          { status: 400 }
        );
      }
      const resolved = await prisma.branch.findUnique({
        where: { slug: branchSlug },
        select: { id: true, state: true, slug: true },
      });
      if (!resolved) {
        return NextResponse.json(
          { success: false, error: `Branch not found for slug "${branchSlug}"` },
          { status: 400 }
        );
      }
      branch = resolved;
      const emailOwner = await prisma.customer.findUnique({
        where: { email: clientEmail },
        select: { id: true },
      });
      if (emailOwner) {
        return NextResponse.json(
          {
            success: false,
            error: "A customer with this email already exists. Select that customer instead.",
            code: "CUSTOMER_EXISTS",
            customerId: emailOwner.id,
          },
          { status: 409 }
        );
      }
      if (body.propertyId?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "A saved property can only be used with an existing customer.",
          },
          { status: 400 }
        );
      }
      const fullAddress = propertyCity
        ? `${propertyAddress}, ${propertyCity}${propertyState ? `, ${propertyState}` : ""}`
        : propertyAddress;
      const created = await prisma.customer.create({
        data: {
          id: randomUUID(),
          firstName: clientFirstName,
          lastName: clientLastName,
          email: clientEmail,
          phone: clientPhone,
          addressLine1: propertyAddress,
          city: propertyCity,
          state: propertyState || branch.state,
          defaultAddress: fullAddress,
          branchId: branch.id,
          updatedAt: new Date(),
        },
        select: { id: true, billingPolicy: true },
      });
      geocodeCustomerInBackground(created.id);
      customerId = created.id;
      customerBilling = created.billingPolicy;
    }

    if (auth.branchId && branch.id !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only create jobs in your assigned branch" },
        { status: 403 }
      );
    }

    let propertyId: string | null = null;
    let propertyBilling: string | null = null;
    let agreedPrice: number | null = null;

    if (customerMode === "existing") {
      const requestedPropertyId = body.propertyId?.trim();
      if (!requestedPropertyId) {
        return NextResponse.json(
          { success: false, error: "propertyId is required for an existing customer" },
          { status: 400 }
        );
      }
      const property = await prisma.property.findUnique({
        where: { id: requestedPropertyId },
        select: {
          id: true,
          customerId: true,
          billingPolicy: true,
          ResidentialProfile: { select: { agreedPrice: true } },
        },
      });
      if (!property || property.customerId !== customerId) {
        return NextResponse.json(
          { success: false, error: "Property does not belong to this customer" },
          { status: 400 }
        );
      }
      propertyId = property.id;
      propertyBilling = property.billingPolicy;
      agreedPrice = moneyOrNull(property.ResidentialProfile?.agreedPrice);
    }

    const protectedPrice =
      priceMode === "operational" ? await protectOperationalPrice(totalAmount) : null;
    const priced = resolveManualJobPrice({
      mode: priceMode,
      totalAmount,
      operationalAmount,
      protectedPrice: protectedPrice
        ? {
            protected: protectedPrice.protected,
            customerPrice: protectedPrice.customerPrice,
            operationalSubtotal: protectedPrice.operationalSubtotal,
            processingAllowanceEstimated: protectedPrice.processingAllowanceEstimated,
            pricingPolicyVersion: protectedPrice.pricingPolicyVersion,
          }
        : null,
    });
    const overridden = priceWasOverridden(agreedPrice, priced.customerTotal, priceMode);

    const depositAmount =
      typeof body.depositAmount === "number" && Number.isFinite(body.depositAmount)
        ? body.depositAmount
        : null;
    const paymentStatus = body.paymentStatus;
    let amountPaid: number | null = 0;
    let balanceDue: number | null = priced.customerTotal;
    if (paymentStatus === PaymentStatus.PAID) {
      amountPaid = priced.customerTotal;
      balanceDue = 0;
    } else if (paymentStatus === PaymentStatus.DEPOSIT_PAID) {
      amountPaid = depositAmount ?? 0;
      balanceDue = Math.max(priced.customerTotal - (depositAmount ?? 0), 0);
    }

    const preferredTime = body.scheduledStartTime?.trim()
      ? body.scheduledEndTime?.trim()
        ? `${body.scheduledStartTime.trim()} - ${body.scheduledEndTime.trim()}`
        : body.scheduledStartTime.trim()
      : null;

    const noteLines = ["[Source: MANUAL]"];
    if (body.internalNotes?.trim()) noteLines.push(body.internalNotes.trim());
    const internalNotes = noteLines.join("\n");

    const marketLabel =
      branch.slug === "vermont" || branch.slug === "new-jersey"
        ? branch.slug
        : body.marketLabel?.trim() || null;

    const customerName = `${jobFirstName}${jobLastName ? ` ${jobLastName}` : ""}`.trim();
    const billingPolicy = resolveBillingPolicy({
      propertyPolicy: propertyBilling,
      customerPolicy: customerBilling,
    });
    const jobReference = await nextVmReference();
    const conflicts = propertyId ? await sameDayJobs(propertyId, preferredDate) : [];

    const job = await prisma.job.create({
      data: {
        id: randomUUID(),
        jobReference,
        Branch: { connect: { id: branch.id } },
        Customer: { connect: { id: customerId } },
        ...(propertyId ? { Property: { connect: { id: propertyId } } } : {}),
        customerName,
        address: propertyAddress,
        serviceLocation: propertyCity,
        serviceType,
        preferredDate,
        preferredTime,
        guestCheckInDate: stayDates.guestCheckInDate,
        guestCheckOutDate: stayDates.guestCheckOutDate,
        currency: "USD",
        billingPolicy,
        totalPrice: priced.customerTotal,
        quotedTotal: priced.customerTotal,
        ...(priced.operationalTotal != null ? { operationalTotal: priced.operationalTotal } : {}),
        ...(priced.processingAllowanceEstimated != null
          ? { processingAllowanceEstimated: priced.processingAllowanceEstimated }
          : {}),
        ...(priced.pricingPolicyVersion
          ? { pricingPolicyVersion: priced.pricingPolicyVersion }
          : {}),
        depositAmount,
        amountPaid,
        balanceDue,
        paymentStatus,
        status: JobStatus.RECEIVED,
        internalNotes,
        marketLabel,
      },
      select: { id: true, propertyId: true },
    });

    await awaitJobGoogleSync(job.id);

    const auditId = await logAuditEntry({
      actorId: auth.userId,
      actorRole: "ADMIN",
      action: "MANUAL_JOB_CREATED",
      entityType: "Job",
      entityId: job.id,
      description:
        "Created a received job from Add Job Manually without changing the customer or property profile.",
      changes: {
        customerMode,
        customerId,
        propertyId,
        serviceCategory,
        serviceType,
        priceInputMode: priceMode,
        agreedPrice,
        customerTotal: priced.customerTotal,
        operationalTotal: priced.operationalTotal,
        processingAllowanceEstimated: priced.processingAllowanceEstimated,
        priceOverridden: overridden,
        guestCheckInDate: stayDates.guestCheckInDate?.toISOString() ?? null,
        guestCheckOutDate: stayDates.guestCheckOutDate?.toISOString() ?? null,
        sameDayJobIds: conflicts.map((row) => row.id),
        status: JobStatus.RECEIVED,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      customerId,
      propertyId: job.propertyId,
      status: JobStatus.RECEIVED,
      sameDayJobs: conflicts.map((row) => ({
        id: row.id,
        jobReference: row.jobReference,
        status: row.status,
        serviceType: row.serviceType,
      })),
      auditId,
      pricing: {
        priceInputMode: priceMode,
        customerTotal: priced.customerTotal,
        operationalTotal: priced.operationalTotal,
        processingAllowanceEstimated: priced.processingAllowanceEstimated,
        pricingPolicyVersion: priced.pricingPolicyVersion,
        agreedPrice,
        priceOverridden: overridden,
        warning: protectedPrice?.warning ?? null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : "Failed to create manual job";
    console.error("[create-manual job]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
