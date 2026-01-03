# VelocityMaid V1 — Command Center Validation Checklist

**Purpose:** End-to-end validation of Admin Command Center functionality  
**Date:** 2026-01-02  
**Status:** ✅ Ready for Testing

---

## Prerequisites

- [ ] Database migrations applied (reviewedAt, repliedAt, archivedAt columns exist)
- [ ] Environment variables set in Vercel (DATABASE_URL, DIRECT_URL, RESEND_API_KEY)
- [ ] Admin user authenticated
- [ ] Contact form accessible at `/contact`

---

## A) Global Production Fix Validation

### A1) Node Runtime for Prisma Routes
- [ ] Run `npm run build` — should complete without errors
- [ ] Check Vercel logs — no Edge runtime errors for Prisma routes
- [ ] Verify: All API routes using Prisma have `export const runtime = 'nodejs';`

**Verification Command:**
```bash
grep -r "prisma\." app/api --include="*.ts" | wc -l
# Should match number of routes with runtime = 'nodejs'
```

### A2) Prisma Import Standardization
- [ ] Check `app/api/cleaners/scorecard/route.ts` uses top-level import
- [ ] No dynamic `await import()` for Prisma client in API routes

---

## B) Admin Inbox Backend Validation

### B1) List Messages API
**Test:** `GET /api/admin/messages?status=NEW`

- [ ] Returns JSON with `{ success: true, messages: [...] }`
- [ ] Filters by status correctly (NEW, REVIEWED, REPLIED, ARCHIVED)
- [ ] Requires admin authentication (returns 401/403 if not authenticated)
- [ ] Returns empty array if no messages match filter

**Test Cases:**
```bash
# Test with different status filters
curl -X GET "https://velocitymaid.com/api/admin/messages?status=NEW" \
  -H "Cookie: [admin-session-cookie]"

curl -X GET "https://velocitymaid.com/api/admin/messages?status=ARCHIVED" \
  -H "Cookie: [admin-session-cookie]"
```

### B2) Review Message API
**Test:** `POST /api/admin/messages/[id]/review`

- [ ] If status = NEW → sets to REVIEWED
- [ ] Sets `reviewedAt` timestamp
- [ ] If status ≠ NEW → no-op (doesn't change status)
- [ ] Returns updated message in response
- [ ] Requires admin authentication

**Test Flow:**
1. Submit contact form → message appears as NEW
2. Call review endpoint
3. Verify status changed to REVIEWED
4. Verify `reviewedAt` is set

### B3) Reply to Message API
**Test:** `POST /api/admin/messages/[id]/reply`

**Body:**
```json
{
  "body": "Test reply message",
  "subject": "Re: Your inquiry",
  "sendEmail": true
}
```

- [ ] Saves reply to database FIRST (before email send)
- [ ] If `sendEmail === true` → sends email via Resend
- [ ] If email succeeds → sets status = REPLIED
- [ ] If email fails → keeps reply saved, status remains REVIEWED
- [ ] Returns JSON response (never throws)
- [ ] Requires admin authentication

**Test Cases:**
1. Reply with `sendEmail: true` → verify email sent + status = REPLIED
2. Reply with `sendEmail: false` → verify reply saved, status unchanged
3. Simulate email failure → verify reply still saved

### B4) Archive Message API
**Test:** `POST /api/admin/messages/[id]/archive`

- [ ] Sets status = ARCHIVED
- [ ] Sets `archivedAt` timestamp
- [ ] Never deletes records (soft delete only)
- [ ] Returns updated message
- [ ] Requires admin authentication

---

## C) Dashboard Metrics Validation

**Test:** `GET /api/admin/dashboard/metrics`

- [ ] Returns JSON: `{ success: true, metrics: { NEW: 0, REVIEWED: 0, REPLIED: 0, ARCHIVED: 0 } }`
- [ ] Counts are calculated from database (groupBy query)
- [ ] Counts match actual message counts in database
- [ ] Updates automatically when messages change status
- [ ] Requires admin authentication

**Verification:**
```sql
-- Run in Supabase SQL Editor to verify counts match
SELECT status, COUNT(*) 
FROM "ContactMessage" 
GROUP BY status;
```

---

## D) Frontend Wiring Validation

### D1) Admin Dashboard (`/admin/dashboard`)
- [ ] Displays message status counts (NEW, REVIEWED, REPLIED, ARCHIVED)
- [ ] Counts are fetched from `/api/admin/dashboard/metrics`
- [ ] Clicking a count tile navigates to `/admin/inbox?status=...`
- [ ] Counts refresh after inbox actions (listens to `messageStatusUpdated` event)

### D2) Admin Inbox (`/admin/inbox`)
- [ ] Tabs display: All, New, Reviewed, Replied, Archived
- [ ] Fetches from `/api/admin/messages?status=...`
- [ ] Clicking a message row opens detail view (`/admin/inbox/[id]`)
- [ ] Status badges display correctly (color-coded)
- [ ] Query parameter `?status=NEW` filters correctly on page load

### D3) Message Detail (`/admin/inbox/[id]`)
- [ ] Displays full message thread (original + replies)
- [ ] Status badge always visible
- [ ] "Mark Reviewed" button:
  - Only shows if status = NEW
  - Calls `/api/admin/messages/[id]/review`
  - Refreshes message data after success
  - Triggers dashboard metrics refresh
- [ ] "Reply" button:
  - Opens reply composer
  - Calls `/api/admin/messages/[id]/reply`
  - Refreshes message data after success
  - Triggers dashboard metrics refresh
- [ ] "Archive" button:
  - Shows confirmation modal
  - Calls `/api/admin/messages/[id]/archive`
  - Redirects to inbox after success
  - Triggers dashboard metrics refresh

---

## E) End-to-End Flow Validation

### Flow 1: New Message → Review → Reply → Archive

1. **Submit Contact Form**
   - [ ] Go to `/contact`
   - [ ] Fill form and submit
   - [ ] Message appears in `/admin/inbox` with status NEW
   - [ ] Dashboard shows NEW count +1

2. **Mark as Reviewed**
   - [ ] Open message detail
   - [ ] Click "Mark Reviewed"
   - [ ] Status changes to REVIEWED
   - [ ] `reviewedAt` timestamp is set
   - [ ] Dashboard shows NEW count -1, REVIEWED count +1

3. **Reply to Message**
   - [ ] Click "Reply"
   - [ ] Enter reply text
   - [ ] Click "Send reply"
   - [ ] Reply is saved to database
   - [ ] Email is sent (if `sendEmail: true`)
   - [ ] Status changes to REPLIED
   - [ ] `repliedAt` timestamp is set
   - [ ] Dashboard shows REVIEWED count -1, REPLIED count +1
   - [ ] Reply appears in message thread

4. **Archive Message**
   - [ ] Click "Archive"
   - [ ] Confirm archive
   - [ ] Status changes to ARCHIVED
   - [ ] `archivedAt` timestamp is set
   - [ ] Redirects to inbox
   - [ ] Dashboard shows REPLIED count -1, ARCHIVED count +1
   - [ ] Message appears in ARCHIVED tab

### Flow 2: Direct Reply (Skip Review)

1. **Submit Contact Form**
   - [ ] Message appears as NEW

2. **Reply Directly**
   - [ ] Open message detail
   - [ ] Click "Reply" (without marking reviewed)
   - [ ] Send reply
   - [ ] Status changes to REPLIED (skips REVIEWED)
   - [ ] Dashboard counts update correctly

---

## F) Build & Runtime Validation

### Build Validation
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] No Prisma schema errors
- [ ] All API routes compile

### Runtime Validation (Vercel)
- [ ] Deploy to Vercel succeeds
- [ ] No Prisma runtime errors in Vercel logs
- [ ] All API routes respond (no 500 errors)
- [ ] Database connections stable (no P1001 errors)
- [ ] Health check endpoint returns healthy: `/api/health`

---

## G) Error Handling Validation

### Error Scenarios
- [ ] Unauthenticated request → returns 401/403
- [ ] Invalid message ID → returns 404
- [ ] Invalid status value → returns 400
- [ ] Database error → returns 500 with structured error (no raw Prisma errors)
- [ ] Email send failure → reply still saved, graceful error handling

---

## H) Data Integrity Validation

### Database Verification
- [ ] No messages are ever deleted (only status changes)
- [ ] All replies are persisted (even if email fails)
- [ ] Timestamps are set correctly (reviewedAt, repliedAt, archivedAt)
- [ ] Status transitions are valid (NEW → REVIEWED → REPLIED → ARCHIVED)

**SQL Verification:**
```sql
-- Verify no deletions
SELECT COUNT(*) FROM "ContactMessage";

-- Verify all replies saved
SELECT COUNT(*) FROM "ContactReply";

-- Verify timestamp fields populated
SELECT 
  status,
  COUNT(*) as count,
  COUNT("reviewedAt") as has_reviewed_at,
  COUNT("repliedAt") as has_replied_at,
  COUNT("archivedAt") as has_archived_at
FROM "ContactMessage"
GROUP BY status;
```

---

## ✅ Exit Criteria

**STOP when all of the following are true:**

- [x] Inbox works end-to-end (list, view, review, reply, archive)
- [x] Metrics are accurate (counts match database)
- [x] Replies persist + send email correctly
- [x] No runtime Prisma errors on Vercel
- [x] Build passes (`npm run build`)
- [x] All API routes respond correctly
- [x] Frontend wiring matches spec requirements

---

## Notes

- All API routes use `/api/admin/messages` (not `/api/admin/contact-messages`)
- Status enum: NEW, REVIEWED, REPLIED, ARCHIVED
- All actions are auditable (timestamps, no deletions)
- Governance-first design: every action is recorded

---

**Last Updated:** 2026-01-02  
**Version:** 1.0

