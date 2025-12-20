# Phase 12A — Payout Validation Checklist

## Goal
Validate that the payout engine works end-to-end with real data.

## Prerequisites
- ✅ Completed job exists
- ✅ Cleaner assigned to job
- ✅ Active payout policy exists for branch
- ✅ Legacy payout (JobPayout) exists

## Validation Steps

### Step 1: Assign Cleaner to Completed Job
```bash
# Option A: API
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/admin/scripts/assign-cleaner"

# Option B: Script
npx tsx scripts/assign-cleaner-to-job.ts
```

**Expected:** Cleaner assigned to a completed job

### Step 2: Create Payout Policy (if not exists)
```bash
# Option A: API
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/admin/scripts/create-nj-payout-policy"

# Option B: Script
npx tsx scripts/create-nj-payout-policy.ts
```

**Expected:** Policy created and assigned to branch

### Step 3: Ensure Legacy Payout Exists
The job should have a `JobPayout` record. If not, the job completion flow should create it.

### Step 4: Run Shadow Backtest
```bash
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/admin/payout-shadow/run" `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "days": 30, "maxJobs": 10 }'
```

**Expected Result:**
```json
{
  "success": true,
  "summary": {
    "processed": 1,
    "stored": 1,
    "skipped_no_policy": 0,
    "skipped_no_legacy": 0,
    "errors": 0
  }
}
```

### Step 5: Run Full Validation
```bash
# Option A: API
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/admin/scripts/validate-payout-engine"

# Option B: Script
npx tsx scripts/validate-payout-engine.ts
```

**Expected:** All checks pass ✅

## Verification Queries

### Check Shadow Result
```sql
SELECT 
  "jobId",
  "branchId",
  "policyVersionId",
  "v1Amount",
  "v2Amount",
  "delta",
  "createdAt"
FROM "PayoutPolicyShadowResult"
ORDER BY "createdAt" DESC
LIMIT 5;
```

### Check JobPayout
```sql
SELECT 
  "id",
  "jobId",
  "cleanerId",
  "grossAmount",
  "cleanerAmount",
  "platformFee",
  "status"
FROM "JobPayout"
ORDER BY "createdAt" DESC
LIMIT 5;
```

### Verify Payout Percentage
```sql
SELECT 
  j."id" as job_id,
  j."totalPrice" as gross_amount,
  jp."cleanerAmount" as v1_amount,
  psr."v2Amount" as v2_amount,
  (psr."v2Amount" / j."totalPrice" * 100) as v2_percent,
  psr."delta"
FROM "Job" j
JOIN "JobPayout" jp ON j."id" = jp."jobId"
JOIN "PayoutPolicyShadowResult" psr ON j."id" = psr."jobId"
WHERE j."status" = 'COMPLETED'
ORDER BY psr."createdAt" DESC
LIMIT 5;
```

## Success Criteria

- ✅ `processed: 1`
- ✅ `stored: 1`
- ✅ `skipped_no_policy: 0`
- ✅ `skipped_no_legacy: 0`
- ✅ `errors: 0`
- ✅ JobPayout row exists
- ✅ PayoutPolicyShadowResult row exists
- ✅ v2Amount = 70% of grossAmount (within 1 cent tolerance)

## Next Steps (Phase 12B)

Once validation passes:
1. Add feature flag: `ENABLE_REAL_PAYOUTS=false`
2. Create admin toggle for payout mode
3. Lock shadow vs live payout mode
4. Prevent accidental payouts in production







