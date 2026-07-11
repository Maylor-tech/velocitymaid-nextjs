/**
 * Idempotent operations-calendar event sync.
 *
 * Idempotency: Job.calendarEventId is the single source of truth for
 * "does this job already have an event" — present means patch (update),
 * absent means insert (create) then persist the new id. A cron or webhook
 * firing twice for the same job always resolves to one event.
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
  cleanerName: string | null;
  calendarEventId: string | null;
}

function adminLinkFor(jobId: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
  return `${base}/admin/jobs/${jobId}`;
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
    `Admin: ${adminLinkFor(job.id)}`,
    '',
    'Exact address and access notes are intentionally excluded — see admin link.',
  ].filter((line): line is string => line !== null);

  const start = job.preferredDate ?? undefined;
  const end = start ? new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS) : undefined;

  return {
    summary,
    description: descriptionLines.join('\n'),
    ...(start && end
      ? { start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } }
      : {}),
  };
}

/** Creates or updates the calendar event for a job. Never throws. */
export async function upsertJobCalendarEvent(job: CalendarJobInput): Promise<string | null> {
  if (!(await isCalendarEnabled())) return null;

  const config = readGoogleEnvConfig();
  const calendarId = config.operationsCalendarId;
  if (!calendarId) return null;

  const body = buildEventBody(job);
  const isUpdate = Boolean(job.calendarEventId);

  try {
    const calendar = getCalendarClient();
    let eventId = job.calendarEventId;

    if (eventId) {
      await calendar.events.patch({ calendarId, eventId, requestBody: body });
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
      calendarEventId: true,
      User: { select: { name: true } },
      Branch: { select: { name: true } },
    },
  });
  if (!job) return;

  await upsertJobCalendarEvent({
    id: job.id,
    jobReference: job.jobReference,
    serviceType: job.serviceType,
    areaLabel: job.serviceLocation || job.Branch?.name || null,
    preferredDate: job.preferredDate,
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
