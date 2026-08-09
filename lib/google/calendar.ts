/**
 * Idempotent operations-calendar event sync.
 *
 * Idempotency: Job.calendarEventId is the single source of truth for
 * "does this job already have an event" — present means patch (update),
 * absent means insert (create) then persist the new id. A cron or webhook
 * firing twice for the same job always resolves to one event.
 *
 * Create gate: new events require preferredDate ("enough scheduling info").
 * Updates always patch the existing event (never insert a second one).
 *
 * Sensitive access codes are intentionally never written into the event
 * description — only the job reference, service type, general property
 * area, assigned cleaner name(s), and an admin link.
 */
import { getCalendarClient } from './client';
import { readGoogleEnvConfig, isCalendarEnabled, recordSyncError } from './config';
import { prisma } from '@/lib/prisma';
import { logIntegrationEvent } from './integrationLog';

const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

export interface CalendarJobInput {
  id: string;
  jobReference: string | null;
  serviceType: string | null;
  /** General area only (e.g. branch/region label) — the exact street address
   *  intentionally never goes on the shared ops calendar. */
  areaLabel: string | null;
  preferredDate: Date | null;
  preferredTime: string | null;
  cleanerName: string | null;
  calendarEventId: string | null;
}

/** True when the job has a scheduled date — required before creating a new event. */
export function hasEnoughSchedulingInfo(job: {
  preferredDate: Date | null | undefined;
}): boolean {
  return Boolean(job.preferredDate);
}

/**
 * Parse a clock time from preferredTime for overlay onto preferredDate.
 * Supports "14:00", "2:00 PM", and range starts like "10:00 - 12:00".
 * Returns null for labels like "Morning" / unparseable values.
 */
export function parsePreferredClockTime(
  preferredTime: string | null | undefined
): { hours: number; minutes: number } | null {
  if (!preferredTime?.trim()) return null;
  const startPart = preferredTime.split('-')[0].trim();
  const ampm = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const minutes = parseInt(ampm[2], 10);
    const mer = ampm[3].toUpperCase();
    if (mer === 'PM' && hours < 12) hours += 12;
    if (mer === 'AM' && hours === 12) hours = 0;
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
  }
  const h24 = startPart.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const hours = parseInt(h24[1], 10);
    const minutes = parseInt(h24[2], 10);
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
  }
  return null;
}

function adminLinkFor(jobId: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
  return `${base}/admin/jobs/${jobId}`;
}

function resolveEventBounds(preferredDate: Date, preferredTime: string | null) {
  const start = new Date(preferredDate);
  const clock = parsePreferredClockTime(preferredTime);
  if (clock) {
    start.setUTCHours(clock.hours, clock.minutes, 0, 0);
  }
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);
  return {
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };
}

function buildEventBody(job: CalendarJobInput) {
  const reference = job.jobReference || job.id;
  const cleanerPart = job.cleanerName ? ` — ${job.cleanerName}` : '';
  const summary = `${reference} ${job.serviceType || 'Cleaning'}${cleanerPart}`;

  const descriptionLines = [
    `Job: ${reference}`,
    job.serviceType ? `Service: ${job.serviceType}` : null,
    job.areaLabel ? `Area: ${job.areaLabel}` : null,
    `Cleaner: ${job.cleanerName || 'Unassigned'}`,
    job.preferredTime ? `Window: ${job.preferredTime}` : null,
    `Admin: ${adminLinkFor(job.id)}`,
    '',
    'Exact address and access notes are intentionally excluded — see admin link.',
  ].filter((line): line is string => line !== null);

  return {
    summary,
    description: descriptionLines.join('\n'),
    ...(job.preferredDate ? resolveEventBounds(job.preferredDate, job.preferredTime) : {}),
  };
}

/** Creates or updates the calendar event for a job. Never throws. */
export async function upsertJobCalendarEvent(job: CalendarJobInput): Promise<string | null> {
  if (!(await isCalendarEnabled())) return null;

  const config = readGoogleEnvConfig();
  const calendarId = config.operationsCalendarId;
  if (!calendarId) return null;

  const isUpdate = Boolean(job.calendarEventId);

  // Create only when the job has a scheduled date; updates always patch the linked event.
  if (!isUpdate && !hasEnoughSchedulingInfo(job)) {
    return null;
  }

  const body = buildEventBody(job);

  try {
    const calendar = getCalendarClient();
    let eventId = job.calendarEventId;

    if (eventId) {
      await calendar.events.patch({ calendarId, eventId, requestBody: body });
      await prisma.job.update({
        where: { id: job.id },
        data: { calendarEventStatus: 'synced' },
      });
    } else {
      const res = await calendar.events.insert({ calendarId, requestBody: body });
      eventId = res.data.id ?? null;
      if (!eventId) throw new Error('Calendar did not return an event id');
      await prisma.job.update({
        where: { id: job.id },
        data: { calendarEventId: eventId, calendarEventStatus: 'synced' },
      });
    }

    await logIntegrationEvent({
      jobId: job.id,
      channel: 'CALENDAR',
      action: isUpdate ? 'UPDATE_CALENDAR_EVENT' : 'CREATE_CALENDAR_EVENT',
      provider: 'GOOGLE_CALENDAR',
      status: 'SUCCESS',
      triggeredBy: 'system',
    });

    return eventId;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Google Calendar error';
    await prisma.job
      .update({ where: { id: job.id }, data: { calendarEventStatus: 'error' } })
      .catch(() => {});
    await logIntegrationEvent({
      jobId: job.id,
      channel: 'CALENDAR',
      action: isUpdate ? 'UPDATE_CALENDAR_EVENT' : 'CREATE_CALENDAR_EVENT',
      provider: 'GOOGLE_CALENDAR',
      status: 'FAILED',
      triggeredBy: 'system',
      errorSummary: message,
    });
    await recordSyncError(message);
    return null;
  }
}

/**
 * Convenience wrapper for call sites that only have a jobId (booking
 * creation/approval, cleaner assignment/reassignment) — loads what's needed
 * and upserts the event in one call. Never throws.
 */
export async function syncJobCalendarEvent(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      jobReference: true,
      serviceType: true,
      serviceLocation: true,
      preferredDate: true,
      preferredTime: true,
      calendarEventId: true,
      status: true,
      User: { select: { name: true } },
      Branch: { select: { name: true } },
    },
  });
  if (!job) return;

  if (job.status === 'CANCELLED' || job.status === 'CANCELLED_EMERGENCY') {
    await cancelJobCalendarEvent(job);
    return;
  }

  await upsertJobCalendarEvent({
    id: job.id,
    jobReference: job.jobReference,
    serviceType: job.serviceType,
    areaLabel: job.serviceLocation || job.Branch?.name || null,
    preferredDate: job.preferredDate,
    preferredTime: job.preferredTime,
    cleanerName: job.User?.name ?? null,
    calendarEventId: job.calendarEventId,
  });
}

/** Convenience wrapper for cancel routes that only have a jobId. Never throws. */
export async function cancelJobCalendarEventById(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true, calendarEventId: true } });
  if (!job) return;
  await cancelJobCalendarEvent(job);
}

/** Marks the event cancelled (not deleted) when a booking is cancelled. Never throws. */
export async function cancelJobCalendarEvent(job: { id: string; calendarEventId: string | null }): Promise<void> {
  if (!job.calendarEventId) return;
  if (!(await isCalendarEnabled())) return;

  const config = readGoogleEnvConfig();
  const calendarId = config.operationsCalendarId;
  if (!calendarId) return;

  try {
    const calendar = getCalendarClient();
    await calendar.events.patch({
      calendarId,
      eventId: job.calendarEventId,
      requestBody: { status: 'cancelled' },
    });
    await prisma.job.update({ where: { id: job.id }, data: { calendarEventStatus: 'cancelled' } });
    await logIntegrationEvent({
      jobId: job.id,
      channel: 'CALENDAR',
      action: 'CANCEL_CALENDAR_EVENT',
      provider: 'GOOGLE_CALENDAR',
      status: 'SUCCESS',
      triggeredBy: 'system',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Google Calendar error';
    await logIntegrationEvent({
      jobId: job.id,
      channel: 'CALENDAR',
      action: 'CANCEL_CALENDAR_EVENT',
      provider: 'GOOGLE_CALENDAR',
      status: 'FAILED',
      triggeredBy: 'system',
      errorSummary: message,
    });
    await recordSyncError(message);
  }
}
