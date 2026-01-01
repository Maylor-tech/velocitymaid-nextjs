# Cron Jobs Setup Guide

**Issue:** Vercel Hobby plan allows 2 cron jobs per **team/account**, not per project.

**Current Status:** All cron jobs temporarily removed to unblock deployment.

---

## Cron Jobs (Can Be Added Later)

### 1. W-9 Reminders
- **Path:** `/api/cron/w9-reminders`
- **Schedule:** `0 9 * * 1` (Monday 9 AM UTC)
- **Purpose:** Send reminder emails to cleaners with incomplete W-9s

### 2. Weekly 1099 Readiness
- **Path:** `/api/cron/weekly-1099-readiness`
- **Schedule:** `0 9 * * 1` (Monday 9 AM UTC)
- **Purpose:** Weekly readiness summary email to admins

### 3. Process Payouts (Optional/Staged)
- **Path:** `/api/cron/process-payouts`
- **Schedule:** `0 9 * * *` (Daily 9 AM UTC) or `*/10 * * * *` (every 10 min - requires Pro)
- **Purpose:** Process approved payout batches
- **Note:** Disabled by default (requires `ENABLE_PAYOUTS=true`)

### 4. Archive Tax Year (Optional)
- **Path:** `/api/cron/archive-tax-year`
- **Schedule:** `5 0 * * *` (Daily 12:05 AM UTC)
- **Purpose:** Auto-archive tax year after Jan 31

---

## How to Add Cron Jobs Back

### Option 1: Upgrade to Pro Plan
- Allows unlimited cron jobs
- Can run more frequently (every 10 minutes)
- $20/month per user

### Option 2: Use External Cron Service
- Use services like cron-job.org, EasyCron, or GitHub Actions
- Call your API endpoints directly
- Free or low-cost options available

### Option 3: Manual Execution
- Cron jobs can be triggered manually via API
- Use admin dashboard or curl commands
- Good for low-frequency tasks

---

## Manual Cron Execution

### W-9 Reminders
```bash
curl -X GET "https://velocitymaid.com/api/cron/w9-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Weekly 1099 Readiness
```bash
curl -X GET "https://velocitymaid.com/api/cron/weekly-1099-readiness" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Process Payouts
```bash
curl -X POST "https://velocitymaid.com/api/cron/process-payouts" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

---

## Vercel Configuration

When ready to add cron jobs back, update `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/w9-reminders",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/weekly-1099-readiness",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Important:** Check total team cron job count before adding. Hobby plan = 2 total across all projects.

---

**Last Updated:** 2025-01-03  
**Status:** Cron jobs temporarily disabled for deployment

