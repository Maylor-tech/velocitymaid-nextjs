-- Booking-calendar sync (Airbnb / VRBO iCal). Not applied on production until approved.
-- Row level security enabled with no policies: Prisma bypasses it; anon cannot read feed URLs.

CREATE TABLE "property_calendar_feeds" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "lastError" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "property_calendar_feeds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "calendar_feed_events" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "jobId" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    CONSTRAINT "calendar_feed_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_calendar_feeds_propertyId_url_key" ON "property_calendar_feeds"("propertyId", "url");
CREATE INDEX "property_calendar_feeds_active_idx" ON "property_calendar_feeds"("active");
CREATE UNIQUE INDEX "calendar_feed_events_feedId_uid_key" ON "calendar_feed_events"("feedId", "uid");
CREATE INDEX "calendar_feed_events_jobId_idx" ON "calendar_feed_events"("jobId");

ALTER TABLE "property_calendar_feeds" ADD CONSTRAINT "property_calendar_feeds_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_feed_events" ADD CONSTRAINT "calendar_feed_events_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "property_calendar_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_feed_events" ADD CONSTRAINT "calendar_feed_events_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "property_calendar_feeds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "calendar_feed_events" ENABLE ROW LEVEL SECURITY;
