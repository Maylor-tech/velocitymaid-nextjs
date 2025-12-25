# Phase 11C — Cleaner Acceptance + Auto-Reassign + SLA Timer

## Overview

Complete implementation of cleaner job acceptance/decline workflow with automatic reassignment and SLA monitoring.

## Status Lifecycle

```
RECEIVED → CONFIRMED → ASSIGNED → IN_PROGRESS → COMPLETED
                              ↓
                         (Decline)
                              ↓
                         CONFIRMED (triggers auto-reassign)
```

## Components

### 1. Cleaner Authentication (`lib/cleanerAuth.ts`)

Validates cleaner identity from:
- **Cookie**: `cleanerId` (existing session)
- **Token**: `Authorization: Bearer <token>` or `cleanerToken` header

Returns `CleanerAuthResult` with cleaner info or error.

### 2. Accept Route (`app/api/cleaner/jobs/[jobId]/accept/route.ts`)

**PATCH** `/api/cleaner/jobs/[jobId]/accept`

**Flow:**
1. Authenticate cleaner
2. Verify job exists and is assigned to cleaner
3. Verify status is `ASSIGNED`
4. Update job status to `IN_PROGRESS`
5. Log audit entry (`JOB_ACCEPTED`)
6. Send customer notification email

**Response:**
```json
{
  "success": true,
  "job": { ... },
  "message": "Job accepted successfully"
}
```

### 3. Decline Route (`app/api/cleaner/jobs/[jobId]/decline/route.ts`)

**PATCH** `/api/cleaner/jobs/[jobId]/decline`

**Flow:**
1. Authenticate cleaner
2. Verify job exists and is assigned to cleaner
3. Verify status is `ASSIGNED`
4. Update AssignmentLog to `DECLINED`
5. Remove `assignedCleanerId`, set status to `CONFIRMED`
6. Log audit entry (`JOB_DECLINED`)
7. Trigger `autoAssignCleaner(jobId)` (non-blocking)

**Response:**
```json
{
  "success": true,
  "job": { ... },
  "message": "Job declined. Reassignment in progress."
}
```

### 4. Auto-Assign Helper (`lib/dispatch/autoAssignCleaner.ts`)

**Function:** `autoAssignCleaner(jobId: string): Promise<AutoAssignResult>`

**Flow:**
1. Get job with branch/customer info
2. Verify status is `CONFIRMED`
3. Find eligible cleaners (ACTIVE, branch match)
4. Exclude cleaners with overlapping bookings
5. Select first available cleaner
6. Create AssignmentLog
7. Update job (assign cleaner, set status to `ASSIGNED`)
8. Send notification email to cleaner
9. Log audit entry (`JOB_AUTO_ASSIGNED`)

**Overlap Detection:**
- Checks AssignmentLog for cleaners with `ASSIGNED` or `IN_PROGRESS` jobs
- Compares `preferredDate` time ranges
- Default duration: 3 hours

### 5. Dispatcher Endpoint (`app/api/admin/dispatcher/run/route.ts`)

**POST** `/api/admin/dispatcher/run`

**Purpose:** SLA timer - finds stale assignments and triggers reassignment

**Flow:**
1. Find `ASSIGNED` jobs where `assignedAt` > 15 minutes ago
2. For each stale job:
   - Log `AUTO_REASSIGN_TRIGGERED`
   - Set status to `CONFIRMED`, clear assignment
   - Call `autoAssignCleaner(jobId)`
3. Log summary (`DISPATCHER_RUN_COMPLETE`)

**Response:**
```json
{
  "success": true,
  "message": "Processed N stale assignments",
  "results": {
    "processed": 5,
    "successful": 4,
    "failed": 1,
    "errors": [...]
  }
}
```

**Usage:** Call periodically (cron, scheduled task, or manual trigger)

### 6. Cleaner UI Pages

#### Jobs List (`app/cleaner/jobs/page.tsx`)

**Route:** `/cleaner/jobs`

**Features:**
- Lists all jobs assigned to authenticated cleaner
- Status filter (All, Assigned, In Progress, Completed)
- Shows: Customer, Date/Time, Address, Price, Service Type
- Links to job detail page

#### Job Detail (`app/cleaner/jobs/[jobId]/page.tsx`)

**Route:** `/cleaner/jobs/[jobId]`

**Features:**
- Full job details
- **Accept** button (if status is `ASSIGNED`)
- **Decline** button (if status is `ASSIGNED`)
- Status badge
- Customer info, address, service details

### 7. API Endpoints

#### Get Cleaner Jobs (`app/api/cleaner/jobs/route.ts`)

**GET** `/api/cleaner/jobs?status=ASSIGNED`

Returns all jobs assigned to authenticated cleaner.

#### Get Job Detail (`app/api/cleaner/jobs/[jobId]/route.ts`)

**GET** `/api/cleaner/jobs/[jobId]`

Returns specific job (if assigned to cleaner).

## Testing

### 1. Test Cleaner Acceptance

```bash
# 1. Assign a job to cleaner (via admin)
POST /api/admin/jobs/{jobId}/assign
{ "cleanerId": "cleaner-id" }

# 2. Cleaner accepts
PATCH /api/cleaner/jobs/{jobId}/accept
# Should: Set status to IN_PROGRESS, send customer email
```

### 2. Test Cleaner Decline

```bash
# 1. Assign a job to cleaner
POST /api/admin/jobs/{jobId}/assign

# 2. Cleaner declines
PATCH /api/cleaner/jobs/{jobId}/decline
# Should: Set status to CONFIRMED, trigger auto-reassign
```

### 3. Test Auto-Reassignment

```bash
# 1. Create a CONFIRMED job
# 2. Call auto-assign
# Or trigger via decline

# Manual test:
# Import and call: autoAssignCleaner(jobId)
```

### 4. Test Dispatcher

```bash
# 1. Create ASSIGNED job with old assignedAt
# 2. Call dispatcher
POST /api/admin/dispatcher/run

# Should find stale jobs and reassign
```

### 5. Test UI

1. Login as cleaner (`/cleaners/login`)
2. Navigate to `/cleaner/jobs`
3. Click on a job
4. Accept or Decline
5. Verify status updates

## Error Handling

All routes include:
- Authentication validation
- Job existence checks
- Status validation
- Assignment verification
- Comprehensive error messages
- Audit logging (non-blocking)

## Security

- Cleaner authentication required for all cleaner endpoints
- Job assignment verification (cleaner can only access their jobs)
- Status validation (prevents invalid transitions)
- Audit trail for all actions

## Future Enhancements

1. **JWT Tokens**: Replace simple token with signed JWT
2. **Scoring**: Enhance auto-assign with cleaner scoring
3. **SMS/WhatsApp**: Add SMS/WhatsApp notifications
4. **Push Notifications**: Mobile app notifications
5. **Advanced Overlap Detection**: More sophisticated time slot conflict checking
6. **Cleaner Preferences**: Allow cleaners to set availability preferences

## Files Created/Modified

### New Files
- `lib/cleanerAuth.ts`
- `app/api/cleaner/jobs/[jobId]/accept/route.ts`
- `app/api/cleaner/jobs/[jobId]/decline/route.ts`
- `app/api/cleaner/jobs/route.ts`
- `app/api/cleaner/jobs/[jobId]/route.ts`
- `lib/dispatch/autoAssignCleaner.ts`
- `app/api/admin/dispatcher/run/route.ts`
- `app/cleaner/jobs/page.tsx`
- `app/cleaner/jobs/[jobId]/page.tsx`

### Modified Files
- None (all new functionality)

## Status

✅ **Complete** - All components implemented and tested

















