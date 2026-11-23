/**
 * Booking-calendar sync: read a host's Airbnb / VRBO export link and turn each
 * upcoming checkout into a turnover request (Job RECEIVED / PENDING) for ops to
 * confirm. It never confirms, assigns, cancels or charges anything on its own:
 * date changes on confirmed jobs and removed stays become admin alerts.
 */
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { nextVmReference } from '@/lib/billing/numbering';
import { resolveBillingPolicy } from '@/lib/billing/billingPolicy';
import { awaitJobGoogleSync } from '@/lib/google/jobGoogleSync';
import {
  adminNotificationHelpers,
  createAdminNotification,
} from '@/lib/notifications/adminNotificationCenter';
import { parseServiceDateInput } from '@/lib/dates/serviceDate';
import { parseIcs } from './ics';
import { isAllowedFeedHost, SOURCE_LABELS, type CalendarSource } from './feedUrl';
import { planSync, type KnownEvent, type PlannedStay } from './plan';

export const CALENDAR_TURNOVER_SERVICE = 'Vacation Rental Turnover';
const MAX_FEED_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 15_000;
/** Jobs in these states are treated as "already in hand" for a date. */
const OPEN_JOB_STATUSES = [
  'RECEIVED',
  'CONFIRMED',
  'ASSIGNED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_QC',
  'COMPLETED',
] as const;

export type FeedSyncResult = {
  feedId: string;
  ok: boolean;
  error?: string;
  created: number;
  linked: number;
  moved: number;
  removed: number;
  restored: number;
  unchanged: number;
  suspiciousEmpty?: boolean;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function fetchFeedText(
  url: string,
  fetchImpl: FetchLike = fetch
): Promise<string> {
  if (!isAllowedFeedHost(url)) throw new Error('Calendar link host is not allowed');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'text/calendar, text/plain;q=0.8, */*;q=0.1' },
      cache: 'no-store',
    });
    if (res.url && !isAllowedFeedHost(res.url)) {
      throw new Error('Calendar link redirected to a host that is not allowed');
    }
    if (!res.ok) throw new Error(`Calendar link returned HTTP ${res.status}`);
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > MAX_FEED_BYTES) throw new Error('Calendar file is too large');
    const text = await res.text();
    if (text.length > MAX_FEED_BYTES) throw new Error('Calendar file is too large');
    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new Error('That link did not return a calendar (check it is the export/iCal link)');
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function day(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayInVermont(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function prettyDay(d: string): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function stayNotes(stay: PlannedStay, sourceLabel: string, checkInTime: string | null): string {
  const lines = [
    `[Source: CALENDAR_SYNC · ${sourceLabel}]`,
    `Same-day turnover: ${stay.sameDayArrival ? 'Yes' : 'No'}`,
  ];
  if (stay.sameDayArrival && checkInTime) lines.push(`Check-in deadline: ${checkInTime}`);
  lines.push(
    `Guest checkout ${prettyDay(stay.end)}` +
      (stay.nextCheckIn ? ` · next arrival ${prettyDay(stay.nextCheckIn)}` : ' · no next arrival listed')
  );
  lines.push('Created from the host booking calendar. Confirm before assigning.');
  return lines.join('\n');
}

export async function syncCalendarFeed(
  feedId: string,
  opts: { now?: Date; fetchImpl?: FetchLike } = {}
): Promise<FeedSyncResult> {
  const now = opts.now ?? new Date();
  const result: FeedSyncResult = {
    feedId,
    ok: false,
    created: 0,
    linked: 0,
    moved: 0,
    removed: 0,
    restored: 0,
    unchanged: 0,
  };

  const feed = await prisma.propertyCalendarFeed.findUnique({
    where: { id: feedId },
    include: {
      Property: {
        include: {
          Customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              branchId: true,
              billingPolicy: true,
              Branch: { select: { slug: true } },
            },
          },
        },
      },
      Events: true,
    },
  });
  if (!feed) return { ...result, error: 'Feed not found' };
  if (!feed.active) return { ...result, error: 'Feed is paused' };

  const property = feed.Property;
  const customer = property.Customer;
  const sourceLabel = SOURCE_LABELS[(feed.source as CalendarSource) ?? 'OTHER'] ?? 'Booking calendar';

  const fail = async (message: string): Promise<FeedSyncResult> => {
    const firstFailure = feed.lastStatus !== 'ERROR';
    await prisma.propertyCalendarFeed.update({
      where: { id: feed.id },
      data: { lastSyncedAt: now, lastStatus: 'ERROR', lastError: message.slice(0, 500) },
    });
    if (firstFailure) {
      await createAdminNotification({
        type: 'CALENDAR_SYNC_ERROR',
        severity: 'WARNING',
        message: `Calendar sync failed for ${property.name} (${sourceLabel}): ${message}`,
        actionUrl: '/admin/calendar-sync',
      });
    }
    return { ...result, error: message };
  };

  if (!customer.branchId) return fail('Customer is not linked to a branch');

  let text: string;
  try {
    text = await fetchFeedText(feed.url, opts.fetchImpl);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not read the calendar link');
  }

  const known: KnownEvent[] = feed.Events.map((e) => ({
    id: e.id,
    uid: e.uid,
    start: day(e.startDate),
    end: day(e.endDate),
    status: e.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE',
    jobId: e.jobId,
  }));
  const plan = planSync(parseIcs(text), known, todayInVermont(now));
  result.suspiciousEmpty = plan.suspiciousEmpty;

  const billingPolicy = resolveBillingPolicy({
    propertyPolicy: property.billingPolicy,
    customerPolicy: customer.billingPolicy,
  });
  const customerName = `${customer.firstName} ${customer.lastName}`.trim() || customer.email;

  /** Link to an existing job for this property + date, or create a new request. */
  const ensureJob = async (stay: PlannedStay): Promise<{ jobId: string; created: boolean }> => {
    const serviceDay = parseServiceDateInput(stay.end)!;
    const existing = await prisma.job.findFirst({
      where: {
        propertyId: property.id,
        preferredDate: serviceDay,
        status: { in: [...OPEN_JOB_STATUSES] },
      },
      select: { id: true },
    });
    if (existing) return { jobId: existing.id, created: false };

    const job = await prisma.job.create({
      data: {
        id: randomUUID(),
        jobReference: await nextVmReference(),
        Branch: { connect: { id: customer.branchId! } },
        Customer: { connect: { id: customer.id } },
        Property: { connect: { id: property.id } },
        customerName,
        address: property.address,
        serviceLocation: property.city ?? null,
        serviceType: CALENDAR_TURNOVER_SERVICE,
        preferredDate: serviceDay,
        preferredTime: property.standardCheckoutTime ? `After checkout (${property.standardCheckoutTime})` : null,
        guestCheckOutDate: serviceDay,
        guestCheckInDate: stay.nextCheckIn ? parseServiceDateInput(stay.nextCheckIn) : null,
        currency: 'USD',
        status: 'RECEIVED',
        paymentStatus: 'PENDING',
        billingPolicy,
        internalNotes: stayNotes(stay, sourceLabel, property.standardCheckinTime),
        marketLabel: customer.Branch?.slug || null,
      },
      select: { id: true, jobReference: true },
    });
    try {
      await awaitJobGoogleSync(job.id);
    } catch (e) {
      console.error('[calendarSync] Google sync failed after job create', e);
    }
    await createAdminNotification({
      type: 'CALENDAR_SYNC_TURNOVER',
      severity: 'INFO',
      message: `New turnover from ${sourceLabel} — ${property.name}, checkout ${prettyDay(stay.end)}${stay.sameDayArrival ? ' (same-day arrival)' : ''} · ${job.jobReference ?? ''}`.trim(),
      jobId: job.id,
      actionUrl: adminNotificationHelpers.adminJobLink(job.id),
      idempotent: true,
    });
    return { jobId: job.id, created: true };
  };

  for (const stay of plan.create) {
    // Claim the stay first: the unique (feedId, uid) stops a parallel run doubling it.
    let eventId: string;
    try {
      const row = await prisma.calendarFeedEvent.create({
        data: {
          feedId: feed.id,
          uid: stay.uid,
          startDate: parseServiceDateInput(stay.start)!,
          endDate: parseServiceDateInput(stay.end)!,
          lastSeenAt: now,
        },
        select: { id: true },
      });
      eventId = row.id;
    } catch {
      continue; // another run already claimed it
    }
    const { jobId, created } = await ensureJob(stay);
    await prisma.calendarFeedEvent.update({ where: { id: eventId }, data: { jobId } });
    if (created) result.created += 1;
    else result.linked += 1;
  }

  for (const { known: k, stay } of plan.restored) {
    const { jobId, created } = await ensureJob(stay);
    await prisma.calendarFeedEvent.update({
      where: { id: k.id },
      data: {
        status: 'ACTIVE',
        cancelledAt: null,
        startDate: parseServiceDateInput(stay.start)!,
        endDate: parseServiceDateInput(stay.end)!,
        lastSeenAt: now,
        jobId,
      },
    });
    if (created) result.created += 1;
    result.restored += 1;
  }

  for (const { known: k, stay } of plan.moved) {
    const job = k.jobId
      ? await prisma.job.findUnique({
          where: { id: k.jobId },
          select: { id: true, status: true, jobReference: true },
        })
      : null;
    const newDay = parseServiceDateInput(stay.end)!;
    if (job && job.status === 'RECEIVED' && k.end !== stay.end) {
      // Not yet confirmed: follow the new checkout.
      await prisma.job.update({
        where: { id: job.id },
        data: {
          preferredDate: newDay,
          guestCheckOutDate: newDay,
          guestCheckInDate: stay.nextCheckIn ? parseServiceDateInput(stay.nextCheckIn) : null,
        },
      });
    }
    if (job && k.end !== stay.end) {
      await createAdminNotification({
        type: 'CALENDAR_SYNC_CHANGE',
        severity: job.status === 'RECEIVED' ? 'INFO' : 'WARNING',
        message:
          `${sourceLabel} checkout moved for ${property.name}: ${prettyDay(k.end)} → ${prettyDay(stay.end)} (${job.jobReference ?? 'job'}).` +
          (job.status === 'RECEIVED' ? ' Request updated.' : ' Job is already scheduled: check the date with the host.'),
        jobId: job.id,
        actionUrl: adminNotificationHelpers.adminJobLink(job.id),
      });
    }
    await prisma.calendarFeedEvent.update({
      where: { id: k.id },
      data: {
        startDate: parseServiceDateInput(stay.start)!,
        endDate: newDay,
        lastSeenAt: now,
      },
    });
    result.moved += 1;
  }

  for (const k of plan.removed) {
    await prisma.calendarFeedEvent.update({
      where: { id: k.id },
      data: { status: 'CANCELLED', cancelledAt: now },
    });
    if (k.jobId) {
      await createAdminNotification({
        type: 'CALENDAR_SYNC_CHANGE',
        severity: 'WARNING',
        message: `${sourceLabel} stay ending ${prettyDay(k.end)} at ${property.name} is no longer on the calendar (cancelled or moved). The turnover was not cancelled: check with the host.`,
        jobId: k.jobId,
        actionUrl: adminNotificationHelpers.adminJobLink(k.jobId),
      });
    }
    result.removed += 1;
  }

  if (plan.unchanged.length) {
    await prisma.calendarFeedEvent.updateMany({
      where: { id: { in: plan.unchanged.map((k) => k.id) } },
      data: { lastSeenAt: now },
    });
    result.unchanged = plan.unchanged.length;
  }

  await prisma.propertyCalendarFeed.update({
    where: { id: feed.id },
    data: {
      lastSyncedAt: now,
      lastStatus: plan.suspiciousEmpty ? 'ERROR' : 'OK',
      lastError: plan.suspiciousEmpty
        ? 'Calendar came back empty though stays were expected; nothing was removed.'
        : null,
    },
  });

  result.ok = true;
  return result;
}

/** Sync every active feed (cron). Feeds run one at a time to stay gentle on the platforms. */
export async function syncAllCalendarFeeds(opts: { now?: Date; fetchImpl?: FetchLike } = {}) {
  const feeds = await prisma.propertyCalendarFeed.findMany({
    where: { active: true },
    select: { id: true },
    orderBy: { lastSyncedAt: { sort: 'asc', nulls: 'first' } },
    take: 200,
  });
  const results: FeedSyncResult[] = [];
  for (const f of feeds) {
    try {
      results.push(await syncCalendarFeed(f.id, opts));
    } catch (e) {
      console.error('[calendarSync] feed failed', f.id, e);
      results.push({
        feedId: f.id,
        ok: false,
        error: e instanceof Error ? e.message : 'Unexpected error',
        created: 0,
        linked: 0,
        moved: 0,
        removed: 0,
        restored: 0,
        unchanged: 0,
      });
    }
  }
  return results;
}
