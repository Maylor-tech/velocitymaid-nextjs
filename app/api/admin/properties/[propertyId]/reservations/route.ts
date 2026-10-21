import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin, requireRole } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { serviceDayKey } from "@/lib/scheduling/hostScheduleReconciliation";
import {
  describeReservationLayers,
  previewReservationImport,
  type ReservationImportRow,
  type StoredReservation,
} from "@/lib/scheduling/hostReservationImport";
import {
  applyReservationWrites,
  type ReservationWriter,
} from "@/lib/scheduling/hostReservationStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { propertyId: string } };

function dayKey(value: Date | null): string | null {
  return serviceDayKey(value);
}

function parseIncoming(raw: unknown): ReservationImportRow[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100) return null;
  const rows: ReservationImportRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const sourceLineKey = String(row.sourceLineKey || "").trim();
    const guestCheckIn = String(row.guestCheckIn || "").trim();
    const guestCheckOut = String(row.guestCheckOut || "").trim();
    const proposedCleaningDate = String(row.proposedCleaningDate || "").trim();
    if (!sourceLineKey || !guestCheckIn || !guestCheckOut || !proposedCleaningDate) return null;
    rows.push({
      sourceLineKey,
      guestCheckIn,
      guestCheckOut,
      proposedCleaningDate,
      proposedCleaningWindow:
        row.proposedCleaningWindow == null ? null : String(row.proposedCleaningWindow),
      bookingSource: row.bookingSource == null ? null : String(row.bookingSource).slice(0, 120),
      hostConfirmationRequired: row.hostConfirmationRequired === true,
    });
  }
  return rows;
}

async function loadProperty(propertyId: string) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true, address: true, customerId: true },
  });
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    assertSuperAdmin(await requireRole(request, "ADMIN"));
    const property = await loadProperty(params.propertyId);
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    const reservations = await prisma.hostReservation.findMany({
      where: { propertyId: property.id },
      orderBy: { guestCheckInDate: "asc" },
      include: {
        Job: {
          select: { id: true, jobReference: true, status: true, preferredDate: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      property,
      reservations: reservations.map((row) => {
        const guestCheckIn = dayKey(row.guestCheckInDate) ?? "";
        const guestCheckOut = dayKey(row.guestCheckOutDate) ?? "";
        const proposedCleaningDate = dayKey(row.proposedCleaningDate);
        return {
          id: row.id,
          guestCheckIn,
          guestCheckOut,
          bookingSource: row.bookingSource,
          proposedCleaningDate,
          proposedCleaningWindow: row.proposedCleaningWindow,
          status: row.status,
          jobId: row.jobId,
          sourceDocumentRef: row.sourceDocumentRef,
          sourceLineKey: row.sourceLineKey,
          notes: row.notes,
          job: row.Job
            ? {
                id: row.Job.id,
                jobReference: row.Job.jobReference,
                status: row.Job.status,
                preferredDate: dayKey(row.Job.preferredDate),
              }
            : null,
          layers: describeReservationLayers({
            guestCheckIn,
            guestCheckOut,
            proposedCleaningDate,
            proposedCleaningWindow: row.proposedCleaningWindow,
            status: row.status,
            jobReference: row.Job?.jobReference ?? (row.jobId ? row.jobId : null),
            jobStatus: row.Job?.status ?? null,
          }),
        };
      }),
    });
  } catch (error) {
    const authResponse = rethrowIfAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("[admin/properties/:id/reservations GET]", error);
    return NextResponse.json({ error: "Failed to load reservations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    assertSuperAdmin(await requireRole(request, "ADMIN"));
    const property = await loadProperty(params.propertyId);
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;
    if (body.createJobs === true || body.notify === true || body.invoice === true) {
      return NextResponse.json(
        { error: "Reservation import cannot create jobs, invoices, or notifications." },
        { status: 400 }
      );
    }
    const mode = body.mode === "apply" ? "apply" : "preview";
    const sourceDocumentRef = String(body.sourceDocumentRef || "").trim().slice(0, 180);
    if (!sourceDocumentRef) {
      return NextResponse.json({ error: "Source document reference is required." }, { status: 400 });
    }
    const incoming = parseIncoming(body.reservations);
    if (!incoming) {
      return NextResponse.json({ error: "Reservation rows are invalid." }, { status: 400 });
    }
    const options = (body.options ?? {}) as Record<string, unknown>;

    const [storedRows, jobs] = await Promise.all([
      prisma.hostReservation.findMany({ where: { propertyId: property.id } }),
      prisma.job.findMany({
        where: { OR: [{ propertyId: property.id }, { customerId: property.customerId }] },
        select: {
          id: true,
          jobReference: true,
          customerId: true,
          propertyId: true,
          preferredDate: true,
          preferredTime: true,
          guestCheckInDate: true,
          guestCheckOutDate: true,
          status: true,
          paymentStatus: true,
          totalPrice: true,
          assignedCleanerId: true,
          calendarEventId: true,
          Invoice: { select: { id: true } },
        },
      }),
    ]);

    const stored: StoredReservation[] = storedRows.map((row) => ({
      id: row.id,
      customerId: row.customerId,
      propertyId: row.propertyId,
      guestCheckIn: dayKey(row.guestCheckInDate) ?? "",
      guestCheckOut: dayKey(row.guestCheckOutDate) ?? "",
      proposedCleaningDate: dayKey(row.proposedCleaningDate),
      proposedCleaningWindow: row.proposedCleaningWindow,
      bookingSource: row.bookingSource,
      status: row.status,
      jobId: row.jobId,
      sourceDocumentRef: row.sourceDocumentRef,
      sourceLineKey: row.sourceLineKey,
    }));

    const preview = previewReservationImport({
      incoming,
      stored,
      jobs: jobs.map((job) => ({
        id: job.id,
        jobReference: job.jobReference,
        customerId: job.customerId,
        propertyId: job.propertyId,
        serviceDate: dayKey(job.preferredDate),
        preferredTime: job.preferredTime,
        guestCheckIn: dayKey(job.guestCheckInDate),
        guestCheckOut: dayKey(job.guestCheckOutDate),
        status: job.status,
        paymentStatus: job.paymentStatus,
        totalPrice: job.totalPrice == null ? null : job.totalPrice.toString(),
        hasInvoice: !!job.Invoice,
        hasCalendarEvent: !!job.calendarEventId,
        assignedCleanerId: job.assignedCleanerId,
      })),
      customerId: property.customerId,
      propertyId: property.id,
      sourceDocumentRef,
      options: {
        acceptDateChanges: options.acceptDateChanges === true,
        linkExistingJobs: options.linkExistingJobs === true,
        reactivateCancelled: options.reactivateCancelled === true,
      },
    });

    if (mode === "preview") {
      return NextResponse.json({ success: true, applied: false, preview });
    }

    const result = await applyReservationWrites(prisma as unknown as ReservationWriter, preview.writes);
    return NextResponse.json({ success: true, applied: true, result, preview });
  } catch (error) {
    const authResponse = rethrowIfAuthResponse(error);
    if (authResponse) return authResponse;
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Import rolled back. A reservation with those dates or source line already exists." },
        { status: 409 }
      );
    }
    console.error("[admin/properties/:id/reservations POST]", error);
    return NextResponse.json({ error: "Reservation import failed" }, { status: 500 });
  }
}
