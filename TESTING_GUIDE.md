# 🧪 VelocityMaid Admin Features - Testing Guide

## Prerequisites

1. **Database Migration** - Run Prisma migration first
2. **Development Server** - Ensure Next.js dev server is running
3. **Test Data** - Have at least one branch, cleaner, and job in the database

---

## Step 1: Run Database Migration

```bash
# Navigate to project root
cd velocitymaid-nextjs

# Run migration to add CleanerRating model
npx prisma migrate dev --name add_cleaner_rating

# Generate Prisma client
npx prisma generate
```

**Expected Result:** Migration completes successfully, CleanerRating table is created.

---

## Step 2: Test Backend APIs

### 2.1 Test Cleaner Rating API

**Endpoint:** `POST /api/ratings/cleaner`

**Test with curl or Postman:**

```bash
curl -X POST http://localhost:3000/api/ratings/cleaner \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "YOUR_JOB_ID",
    "cleanerId": "YOUR_CLEANER_ID",
    "rating": 5,
    "comment": "Excellent service!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "rating": {
    "id": "...",
    "jobId": "...",
    "cleanerId": "...",
    "rating": 5,
    "comment": "Excellent service!",
    "createdAt": "..."
  }
}
```

**Verify:**
- Check that `jobQualityScore` is updated to `100` (rating * 20)
- Check database: `SELECT * FROM "CleanerRating" WHERE "jobId" = '...'`

---

### 2.2 Test Cleaner Profile API (Extended)

**Endpoint:** `GET /api/admin/cleaners/[cleanerId]`

**Test in browser:**
```
http://localhost:3000/api/admin/cleaners/YOUR_CLEANER_ID
```

**Expected Response includes:**
- `ratings` object with `average`, `count`, `recent[]`
- `performance` object with `completionRate`, `productivityScore`
- `payouts` object with `latest[]`, `totalPaid`
- `compliance` object with `status`, `issues[]`

**Verify:**
- All new fields are present
- Ratings average is calculated correctly
- Productivity score is between 0-100
- Compliance status is correct

---

### 2.3 Test Branch Metrics API

**Endpoint:** `GET /api/admin/branches/[branchId]/metrics`

**Test in browser:**
```
http://localhost:3000/api/admin/branches/YOUR_BRANCH_ID/metrics
```

**Expected Response:**
```json
{
  "success": true,
  "branch": { "id": "...", "name": "..." },
  "metrics": {
    "jobsToday": 5,
    "jobsWeek": 23,
    "unassignedJobs": 3,
    "cleaners": 8,
    "customers": 150,
    "revenueWeek": 1250.50
  }
}
```

**Verify:**
- All metrics are numbers (not null/undefined)
- Revenue is calculated correctly
- Counts match database

---

## Step 3: Test UI Components

### 3.1 Test Cleaner Profile Drawer

**Path:** `/admin/jobs`

**Steps:**
1. Open Jobs Board
2. Click on any job card
3. Job Detail Drawer opens
4. In "Cleaner Assignment" section, click the cleaner's name (blue link)
5. Cleaner Profile Drawer should slide in from right

**What to Check:**
- ✅ Drawer opens smoothly
- ✅ All sections load:
  - Header (name, email, active status)
  - Branch & Location
  - Availability
  - Training & Certification
  - **Ratings & Reviews** (NEW)
    - Average rating displays
    - Review count shows
    - Recent reviews list appears
  - **Performance Snapshot** (EXTENDED)
    - Productivity Score progress bar shows
    - Completion Rate from performance object
  - **Payout Summary** (NEW)
    - Total paid amount displays
    - Latest 3 payouts show with dates/amounts
  - **Compliance** (NEW)
    - Status badge (green for COMPLIANT, amber for issues)
    - Issues list shows if any
  - Upcoming Jobs
  - Recent Completed Jobs

---

### 3.2 Test Cleaner Profile from Assign Modal

**Path:** `/admin/jobs`

**Steps:**
1. Open Jobs Board
2. Click on any job card
3. Click "Assign Manually" button
4. Assign Cleaner Modal opens
5. Click on any cleaner's name (should be blue/clickable)
6. Modal closes, Cleaner Profile Drawer opens

**What to Check:**
- ✅ Cleaner names are clickable
- ✅ Modal closes when clicking name
- ✅ Profile drawer opens with correct cleaner
- ✅ All data loads correctly

---

### 3.3 Test Branch KPI Cards

**Path:** `/admin/branches/[slug]` (e.g., `/admin/branches/new-jersey`)

**Steps:**
1. Navigate to any branch detail page
2. Scroll down past branch information
3. Look for "Branch KPIs" section

**What to Check:**
- ✅ "Branch KPIs" heading appears
- ✅ 6 KPI cards display in grid:
  - Jobs Today (with briefcase icon)
  - Jobs This Week (with calendar icon)
  - Unassigned Jobs (highlighted in blue)
  - Active Cleaners (with users icon)
  - Customers (with users icon)
  - Revenue This Week (with dollar icon, formatted currency)
- ✅ Loading spinner shows while fetching
- ✅ Numbers match actual data
- ✅ Unassigned Jobs card has blue highlight

---

### 3.4 Test Match Score in Assign Modal

**Path:** `/admin/jobs`

**Steps:**
1. Open a job with a preferred date/time
2. Click "Assign Manually"
3. View cleaner cards

**What to Check:**
- ✅ Each cleaner shows "Match X/100" badge
- ✅ Highest scoring cleaner shows "Recommended" badge
- ✅ Cleaners are sorted by match score (best first)
- ✅ Available cleaners appear first
- ✅ Unavailable cleaners are disabled

---

## Step 4: Test Rating Creation Flow

**Scenario:** Customer rates a cleaner after job completion

**Steps:**
1. Find a completed job with an assigned cleaner
2. Use API or create a test rating:
   ```bash
   POST /api/ratings/cleaner
   {
     "jobId": "completed_job_id",
     "cleanerId": "cleaner_id",
     "rating": 4,
     "comment": "Great work!"
   }
   ```
3. Open Cleaner Profile Drawer for that cleaner
4. Check "Ratings & Reviews" section

**What to Check:**
- ✅ Rating appears in recent reviews
- ✅ Average rating updates
- ✅ Review count increases
- ✅ Comment displays correctly
- ✅ Job's `jobQualityScore` is set to `80` (4 * 20)

---

## Step 5: Test Compliance Logic

**Test Cases:**

### Case 1: Compliant Cleaner
- Training status: PASSED (for Jamaica)
- ID document uploaded
- References uploaded
- **Expected:** Green "Compliant" badge, no issues

### Case 2: Missing Training
- Jamaica branch cleaner
- Training status: NOT_STARTED or IN_PROGRESS
- **Expected:** Amber "Missing Training" badge, issue listed

### Case 3: Missing Documents
- ID or references not uploaded
- **Expected:** Amber "Missing Documents" badge, specific issues listed

**Steps:**
1. Open Cleaner Profile Drawer
2. Scroll to "Compliance" section
3. Verify status and issues match cleaner's actual state

---

## Step 6: Test Performance Metrics

**What to Verify:**

1. **Productivity Score Calculation:**
   - Weekly jobs: up to 30 points (max 10 jobs = 30 points)
   - Completion rate: up to 30 points (100% = 30 points)
   - Average rating: up to 30 points (5 stars = 30 points)
   - Total capped at 100

2. **Completion Rate:**
   - Should be: `(completedJobs / totalAssigned) * 100`
   - Displayed with 1 decimal place

**Test:**
- Open Cleaner Profile Drawer
- Check "Performance Snapshot" section
- Verify productivity score bar shows correct percentage
- Verify completion rate matches calculation

---

## Step 7: Test Payout Display

**Prerequisites:** Cleaner must have Jamaica payouts

**Steps:**
1. Open Cleaner Profile Drawer for a cleaner with payouts
2. Scroll to "Payout Summary" section

**What to Check:**
- ✅ Total paid amount displays correctly
- ✅ Latest 3 payouts show:
  - Period dates (formatted)
  - Amount with currency symbol
  - Status badge (PAID = green, PENDING = yellow)
  - Branch name
- ✅ If no payouts: "No payouts yet" message

---

## Step 8: Test Branch Metrics Accuracy

**Manual Verification:**

1. Go to branch detail page
2. Note the KPI values
3. Manually verify in database:

```sql
-- Jobs today
SELECT COUNT(*) FROM "Job" 
WHERE "branchId" = 'YOUR_BRANCH_ID' 
AND DATE("preferredDate") = CURRENT_DATE;

-- Jobs this week
SELECT COUNT(*) FROM "Job" 
WHERE "branchId" = 'YOUR_BRANCH_ID' 
AND "preferredDate" >= date_trunc('week', CURRENT_DATE)
AND "preferredDate" < date_trunc('week', CURRENT_DATE) + interval '7 days';

-- Unassigned jobs
SELECT COUNT(*) FROM "Job" 
WHERE "branchId" = 'YOUR_BRANCH_ID' 
AND "assignedCleanerId" IS NULL
AND "status" NOT IN ('cancelled', 'completed')
AND "preferredDate" >= CURRENT_DATE;
```

**Compare:** API values should match database counts

---

## Common Issues & Fixes

### Issue: "CleanerRating model not found"
**Fix:** Run `npx prisma generate` after migration

### Issue: Ratings section not showing
**Fix:** Check API response includes `ratings` object. Verify cleaner has ratings in database.

### Issue: Productivity score is 0
**Fix:** Check if cleaner has:
- Weekly jobs assigned
- Completed jobs (for completion rate)
- Ratings (for rating component)

### Issue: Compliance shows "MISSING_DOCS" incorrectly
**Fix:** Verify `CleanerApplication` exists and has `idUploadUrl` and `referencesUploadUrl`

### Issue: Branch metrics not loading
**Fix:** 
- Check branch ID is correct
- Verify API endpoint: `/api/admin/branches/[branchId]/metrics` (not slug)
- Check browser console for errors

---

## Quick Test Checklist

- [ ] Migration runs successfully
- [ ] Prisma client regenerated
- [ ] Rating API creates rating
- [ ] Cleaner Profile API returns all new fields
- [ ] Branch Metrics API returns correct data
- [ ] Cleaner Profile Drawer opens from Job Detail
- [ ] Cleaner Profile Drawer opens from Assign Modal
- [ ] Ratings section displays correctly
- [ ] Performance section shows productivity score
- [ ] Payout summary displays
- [ ] Compliance status is accurate
- [ ] Branch KPI cards render
- [ ] Match scores show in Assign Modal
- [ ] Recommended badge appears on best cleaner

---

## Next Steps After Testing

1. **Fix any issues** found during testing
2. **Add test data** if needed (ratings, payouts, etc.)
3. **Verify edge cases** (no ratings, no payouts, etc.)
4. **Check mobile responsiveness** of new UI components
5. **Test with real production data** (if available)

---

## Need Help?

If you encounter errors:
1. Check browser console for frontend errors
2. Check server logs for backend errors
3. Verify database schema matches Prisma schema
4. Ensure all API endpoints return `success: true`

