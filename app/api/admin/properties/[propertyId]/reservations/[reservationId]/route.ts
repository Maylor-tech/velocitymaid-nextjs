import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin, requireRole } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { parsePreferredTimeWindow } from "@/lib/dates/preferredClock";
import { utcMidnightFromDateKey } from "@/lib/scheduling/hostReservationImport";
import type { HostReservationStatus } from "@/lib/scheduling/hostReservationImport";
import { serviceDayKey } from "@/lib/scheduling/hostScheduleReconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { propertyId: string; reservationId: string } };

const STATUSES = new Set<HostReservationStatus>([
  "UNCONFIRMED",
  "HOST_CONFIRMATION_REQUIRED",
  "CONFIRMED",
  "HELD",
  "CANCELLED",
]);

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function rangedWindow(value: string): boolean {
  const parsed = parsePreferredTimeWindow(value);
  return !!parsed?.end;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    assertSuperAdmin(await requireRole(request, "ADMIN"));
    const existing = await prisma.hostReservation.findFirst({
      where: { id: params.reservationId, propertyId: params.propertyId },
    });
    if (!existing) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    let action = "UPDATED";

    if (body.status != null) {
      const status = String(body.status) as HostReservationStatus;
      if (!STATUSES.has(status)) {
        return NextResponse.json({ error: "Unknown confirmation status." }, { status: 400 });
      }
      data.status = status;
    }

    if (body.proposedCleaningDate != null) {
      const day = String(body.proposedCleaningDate);
      if (!isDateKey(day)) {
        return NextResponse.json({ error: "Proposed cleaning date must be YYYY-MM-DD." }, { status: 400 });
      }
      data.proposedCleaningDate = utcMidnightFromDateKey(day);
    }

    if (body.guestCheckIn != null || body.guestCheckOut != null) {
      const guestCheckIn = String(body.guestCheckIn ?? serviceDayKey(existing.guestCheckInDate));
      const guestCheckOut = String(body.guestCheckOut ?? serviceDayKey(existing.guestCheckOutDate));
      if (!isDateKey(guestCheckIn) || !isDateKey(guestCheckOut) || guestCheckIn >= guestCheckOut) {
        return NextResponse.json({ error: "Check-in must be before check-out." }, { status: 400 });
      }
      data.guestCheckInDate = utcMidnightFromDateKey(guestCheckIn);
      data.guestCheckOutDate = utcMidnightFromDateKey(guestCheckOut);
      action = "DATE_CHANGED";
    }

    if (body.proposedCleaningWindow != null) {
      const window = String(body.proposedCleaningWindow).trim();
      if (window && !rangedWindow(window)) {
        return NextResponse.json(
          { error: "Record the access window as a range, such as 7:00 AM - 8:00 PM." },
          { status: 400 }
        );
      }
      data.proposedCleaningWindow = window || null;
    }

    if (body.bookingSource != null) data.bookingSource = String(body.bookingSource).slice(0, 120);
    if (body.notes != null) data.notes = String(body.notes).slice(0, 2000);
    if (body.sourceDocumentRef != null) data.sourceDocumentRef = String(body.sourceDocumentRef).slice(0, 180);

    if (body.jobId !== undefined) {
      if (body.jobId === null || body.jobId === "") {
        data.jobId = null;
        action = "JOB_UNLINKED";
      } else {
        const job = await prisma.job.findUnique({
          where: { id: String(body.jobId) },
          select: { id: true, propertyId: true, customerId: true },
        });
        if (!job || job.propertyId !== existing.propertyId || job.customerId !== existing.customerId) {
          return NextResponse.json(
            { error: "That job is not on this property and customer." },
            { status: 400 }
          );
        }
        data.jobId = job.id;
        action = "JOB_LINKED";
      }
    }

    const nextStatus = (data.status as HostReservationStatus | undefined) ?? existing.status;
    const nextWindow =
      data.proposedCleaningWindow !== undefined
        ? (data.proposedCleaningWindow as string | null)
        : existing.proposedCleaningWindow;
    if (nextStatus === "CONFIRMED" && !nextWindow) {
      return NextResponse.json(
        { error: "A confirmed stay needs a recorded access window." },
        { status: 400 }
      );
    }
    if (nextStatus === "CONFIRMED" && nextWindow && !rangedWindow(nextWindow)) {
      return NextResponse.json(
        { error: "Confirmed access windows must be a start and end." },
        { status: 400 }
      );
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const before = {
      guestCheckIn: serviceDayKey(existing.guestCheckInDate),
      guestCheckOut: serviceDayKey(existing.guestCheckOutDate),
      proposedCleaningDate: serviceDayKey(existing.proposedCleaningDate),
      proposedCleaningWindow: existing.proposedCleaningWindow,
      status: existing.status,
      jobId: existing.jobId,
      notes: existing.notes,
    };

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.hostReservation.update({
        where: { id: existing.id },
        data,
      });
      await tx.hostReservationEvent.create({
        data: {
          reservationId: saved.id,
          action,
          before,
          after: {
            guestCheckIn: serviceDayKey(saved.guestCheckInDate),
            guestCheckOut: serviceDayKey(saved.guestCheckOutDate),
            proposedCleaningDate: serviceDayKey(saved.proposedCleaningDate),
            proposedCleaningWindow: saved.proposedCleaningWindow,
            status: saved.status,
            jobId: saved.jobId,
            notes: saved.notes,
          },
        },
      });
      return saved;
    });

    return NextResponse.json({ success: true, id: updated.id, status: updated.status, jobId: updated.jobId });
  } catch (error) {
    const authResponse = rethrowIfAuthResponse(error);
    if (authResponse) return authResponse;
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Another reservation already uses that check-in and check-out." },
        { status: 409 }
      );
    }
    console.error("[admin/properties/:id/reservations/:reservationId PATCH]", error);
    return NextResponse.json({ error: "Reservation update failed" }, { status: 500 });
  }
}
