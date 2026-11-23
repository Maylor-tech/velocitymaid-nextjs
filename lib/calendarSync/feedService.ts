/**
 * Add / list / remove a property's booking-calendar links. Shared by the host
 * portal and admin routes. Views never include the raw link.
 */
import { prisma } from '@/lib/prisma';
import { checkFeedUrl, maskFeedUrl, SOURCE_LABELS, type CalendarSource } from './feedUrl';

export const MAX_FEEDS_PER_PROPERTY = 5;

export type CalendarFeedView = {
  id: string;
  propertyId: string;
  source: string;
  sourceLabel: string;
  label: string | null;
  maskedUrl: string;
  active: boolean;
  lastSyncedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  upcomingStays: number;
};

type FeedRow = {
  id: string;
  propertyId: string;
  source: string;
  url: string;
  label: string | null;
  active: boolean;
  lastSyncedAt: Date | null;
  lastStatus: string | null;
  lastError: string | null;
  _count?: { Events: number };
};

export function toFeedView(row: FeedRow): CalendarFeedView {
  return {
    id: row.id,
    propertyId: row.propertyId,
    source: row.source,
    sourceLabel: SOURCE_LABELS[row.source as CalendarSource] ?? 'Booking calendar',
    label: row.label,
    maskedUrl: maskFeedUrl(row.url),
    active: row.active,
    lastSyncedAt: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : null,
    lastStatus: row.lastStatus,
    lastError: row.lastError,
    upcomingStays: row._count?.Events ?? 0,
  };
}

function upcomingCount() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return {
    select: {
      Events: { where: { status: 'ACTIVE', endDate: { gte: today } } },
    },
  };
}

export async function listPropertyFeeds(propertyId: string): Promise<CalendarFeedView[]> {
  const rows = await prisma.propertyCalendarFeed.findMany({
    where: { propertyId },
    orderBy: { createdAt: 'asc' },
    include: { _count: upcomingCount() },
  });
  return rows.map(toFeedView);
}

export type AddFeedResult =
  | { ok: true; feed: CalendarFeedView }
  | { ok: false; status: number; error: string };

export async function addPropertyFeed(input: {
  propertyId: string;
  url: unknown;
  label?: unknown;
  createdBy: string;
}): Promise<AddFeedResult> {
  const check = checkFeedUrl(input.url);
  if ('error' in check) return { ok: false, status: 400, error: check.error };

  const count = await prisma.propertyCalendarFeed.count({
    where: { propertyId: input.propertyId },
  });
  if (count >= MAX_FEEDS_PER_PROPERTY) {
    return { ok: false, status: 400, error: 'This property already has the maximum number of calendars.' };
  }
  const existing = await prisma.propertyCalendarFeed.findFirst({
    where: { propertyId: input.propertyId, url: check.url },
    select: { id: true },
  });
  if (existing) return { ok: false, status: 409, error: 'That calendar is already connected.' };

  const label =
    typeof input.label === 'string' && input.label.trim() ? input.label.trim().slice(0, 80) : null;
  const row = await prisma.propertyCalendarFeed.create({
    data: {
      propertyId: input.propertyId,
      source: check.source,
      url: check.url,
      label,
      createdBy: input.createdBy.slice(0, 200),
    },
  });
  return { ok: true, feed: toFeedView({ ...row, _count: { Events: 0 } }) };
}

/**
 * Remove a link. Turnover requests already created stay as they are;
 * only future syncing stops.
 */
export async function removePropertyFeed(feedId: string, propertyId: string): Promise<boolean> {
  const res = await prisma.propertyCalendarFeed.deleteMany({
    where: { id: feedId, propertyId },
  });
  return res.count > 0;
}
