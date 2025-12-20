# Cleaner Incentive Engine - Setup Guide

## Overview

The Cleaner Incentive Engine automatically calculates performance-based bonuses and assigns tiers (Bronze, Silver, Gold, Platinum) based on measurable weekly/monthly performance metrics.

## Features

- **Automatic Tier Calculation**: Based on jobs, ratings, on-time rate, and complaint rate
- **Performance-Based Bonuses**: Tier-based bonus per job completed
- **Weekly Reports**: Automatic calculation and notification
- **Admin Dashboard**: View all cleaner incentives and trends
- **Cleaner Portal**: View personal tier, bonus, and requirements

## Tier System

### Tier Requirements

**Platinum:**
- Avg Rating: ≥ 4.8
- On-Time Rate: ≥ 90%
- Complaint Rate: < 5%
- Total Jobs: ≥ 15

**Gold:**
- Avg Rating: ≥ 4.5
- On-Time Rate: ≥ 85%
- Complaint Rate: < 10%
- Total Jobs: ≥ 10

**Silver:**
- Avg Rating: ≥ 4.2
- On-Time Rate: ≥ 80%
- Complaint Rate: < 15%
- Total Jobs: ≥ 6

**Bronze:**
- Everyone else with at least 3 jobs

### Bonus Calculation

- **Platinum**: $7.00 × completed jobs
- **Gold**: $5.00 × completed jobs
- **Silver**: $3.00 × completed jobs
- **Bronze**: $1.50 × completed jobs

Bonuses are rounded to 2 decimal places.

## Routes

### Frontend Pages

- `/dashboard/incentives` - Admin incentive dashboard
- `/cleaners/incentives` - Cleaner incentive page

### API Endpoints

- `GET /api/incentives/list?cleanerId=xxx` - List incentives
- `POST /api/incentives/run-report` - Manually trigger weekly report

## Weekly Report Process

### Automatic Execution

The weekly report should run every Sunday night (via cron or scheduled job):

1. **For each cleaner:**
   - Fetch all jobs completed in last 7 days
   - Calculate metrics:
     - totalJobs
     - onTimeRate
     - completionRate
     - avgRating
     - complaintRate
   - Determine tier
   - Calculate bonusAmount
   - Save to CleanerIncentives table

2. **Send WhatsApp to cleaner:**
   - Template: `weekly_incentive_summary_v1`
   - Parameters: cleaner_name, tier, total_jobs, bonus_amount

3. **Send email to admin:**
   - Summary of all incentives processed
   - Bonus totals by branch
   - Top 3 performers

### Manual Execution

Admins can manually trigger the report:
```bash
POST /api/incentives/run-report
```

## Database Model

### CleanerIncentives Table Schema

```sql
CREATE TABLE cleaner_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_jobs INTEGER NOT NULL,
  on_time_rate DECIMAL(5,2) NOT NULL,
  completion_rate DECIMAL(5,2) NOT NULL,
  avg_rating DECIMAL(3,2) NOT NULL,
  complaint_rate DECIMAL(5,2) NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  tier VARCHAR(20) NOT NULL 
    CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
);
```

## WhatsApp Template

### Weekly Incentive Summary Template

**Template Name:** `weekly_incentive_summary_v1`

**Language:** `en_US`

**Body:**
```
🎉 Weekly Performance Summary

Hi {{1}}!

Your performance tier this week: {{2}}
Jobs completed: {{3}}
Bonus earned: {{4}}

Keep up the great work!
```

**Parameters:**
1. cleaner_name
2. tier (Bronze/Silver/Gold/Platinum)
3. total_jobs
4. bonus_amount (formatted as $XX.XX)

## Integration Points

### Cleaner Scorecard

- **Location:** `/app/cleaners/scorecard/page.tsx`
- **Updates:**
  - Current tier display
  - This week's bonus
  - Next tier requirements

### Cleaner Dashboard

- **Location:** `/app/cleaners/dashboard/page.tsx`
- **Updates:**
  - "My Incentives" button added

### Review System

- Every new review updates avgRating
- Rating changes affect tier calculation

### Complaint System

- Complaint creation/resolution updates complaintRate
- Complaint rate affects tier eligibility

### Job Completion

- Every completion updates performance metrics
- Metrics recalculated in real-time

## Scheduled Job Setup

### Option 1: Cron Job

Add to crontab:
```bash
0 0 * * 0 node /path/to/runWeeklyIncentiveReport.js
```

### Option 2: Next.js API Route + External Scheduler

1. Create API route: `/api/incentives/run-report`
2. Use external service (e.g., cron-job.org) to call endpoint weekly
3. Protect route with admin authentication

### Option 3: Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/incentives/run-report",
    "schedule": "0 0 * * 0"
  }]
}
```

## Testing

### Test Tier Calculation

```typescript
import { calculateTier, calculateBonus } from '@/utils/incentiveEngine';

const metrics = {
  totalJobs: 12,
  avgRating: 4.6,
  onTimeRate: 88,
  complaintRate: 8,
};

const tier = calculateTier(metrics); // Should return "Gold"
const bonus = calculateBonus(tier, metrics.totalJobs); // Should return 60.00
```

### Test Weekly Report

1. Manually trigger report:
   ```bash
   POST /api/incentives/run-report
   ```

2. Verify:
   - Incentives created for all cleaners
   - WhatsApp messages sent
   - Admin email sent (if configured)

## Database Migration

### Current Implementation

- Uses in-memory mock storage
- All functions ready for DB migration
- TODO comments mark migration points

### Migration Steps

1. **Create CleanerIncentives Table** (see schema above)
2. **Update `incentiveData.ts`**:
   - Replace mock storage with database queries
   - Add connection pooling
   - Implement transactions

3. **Add Foreign Keys**:
   - Link to cleaners table

4. **Add Indexes**:
   ```sql
   CREATE INDEX idx_incentives_cleaner ON cleaner_incentives(cleaner_id);
   CREATE INDEX idx_incentives_period ON cleaner_incentives(period_start, period_end);
   CREATE INDEX idx_incentives_tier ON cleaner_incentives(tier);
   ```

## Access Control

**Current Status:** TODO - Admin authentication not yet implemented

**To Implement:**
1. Create admin authentication check
2. Add to `/app/dashboard/incentives/page.tsx`
3. Add to `/api/incentives/run-report` route
4. Redirect unauthorized users

## Future Enhancements

1. **Monthly Bonuses**
   - Additional monthly tier bonuses
   - Quarterly performance reviews

2. **Custom Bonuses**
   - Admin-assigned special bonuses
   - Milestone rewards

3. **Performance Predictions**
   - Predict next tier based on current trajectory
   - Suggest improvements

4. **Payment Integration**
   - Automatic bonus payments
   - Payment history tracking




