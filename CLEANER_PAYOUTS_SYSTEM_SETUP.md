# Automated Cleaner Payouts System - Setup Guide

## Overview

The Automated Cleaner Payouts System calculates weekly earnings for cleaners, combining base pay per job with incentive bonuses. It provides admin approval workflows and cleaner earnings visibility.

## Features

- **Automatic Calculation**: Base pay + bonuses - deductions
- **Weekly Generation**: Automatic payout generation for previous week
- **Admin Approval**: Review, approve, and mark as paid
- **Cleaner Portal**: View earnings history and current payout
- **CSV Export**: Export payouts for external payment processing

## Base Pay Rates

- **Basic Clean**: $50.00 per job
- **Deep Clean**: $80.00 per job
- **Move In/Out**: $110.00 per job

## Payout Formula

```
netPayout = baseEarnings + bonusEarnings - deductions
```

Where:
- `baseEarnings` = Sum of base pay for all completed jobs in period
- `bonusEarnings` = From CleanerIncentives table for the period
- `deductions` = Optional deductions (default: 0)

## Routes

### Frontend Pages

- `/dashboard/payouts` - Admin payout dashboard
- `/cleaners/earnings` - Cleaner earnings page

### API Endpoints

- `GET /api/payouts/list` - List payouts with filters
- `PATCH /api/payouts/update` - Update payout status/details
- `POST /api/payouts/generate` - Manually trigger payout generation
- `GET /api/payouts/export` - Export payouts as CSV

## Weekly Payout Generation

### Automatic Execution

The weekly payout should run every Monday morning (via cron or scheduled job):

1. **Define Period**: Last Monday to last Sunday
2. **For each cleaner:**
   - Fetch completed jobs in period
   - Calculate base earnings
   - Get bonus earnings from Incentive Engine
   - Calculate net payout
   - Create payout record with status "pending"

3. **Send Email to Admin:**
   - Summary of payouts generated
   - Total net payouts
   - NJ vs VT breakdown

### Manual Execution

Admins can manually trigger:
```bash
POST /api/payouts/generate
```

## Database Model

### CleanerPayouts Table Schema

```sql
CREATE TABLE cleaner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  branch VARCHAR(20) NOT NULL 
    CHECK (branch IN ('new_jersey', 'vermont')),
  total_jobs INTEGER NOT NULL,
  base_earnings DECIMAL(10,2) NOT NULL,
  bonus_earnings DECIMAL(10,2) NOT NULL,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_payout DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL 
    CHECK (status IN ('pending', 'approved', 'paid')),
  payment_method VARCHAR(20) 
    CHECK (payment_method IN ('manual', 'stripe', 'bank_transfer', 'cash')),
  payment_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
);
```

## Payout Status Workflow

```
pending → approved → paid
```

- **pending**: Payout generated, awaiting admin review
- **approved**: Admin approved, ready for payment
- **paid**: Payment completed, paidAt timestamp set

## Integration Points

### Incentive Engine

- Payout engine reads from `CleanerIncentives` table
- Bonus earnings pulled for matching period
- TODO: Link incentive calculation to payout generation

### Complaints System

- TODO: Allow complaints to apply deductions
- Future: Automatic deduction for unresolved complaints

### Branch Profitability

- TODO: Subtract payouts from branch revenue
- Future: Calculate net profit = revenue - costs - payouts

## CSV Export

### Export Format

CSV includes:
- Cleaner Name
- Cleaner ID
- Branch
- Period Start
- Period End
- Net Payout
- Payment Method
- Payment Reference
- Status

### Usage

1. Filter payouts in admin dashboard
2. Click "Export CSV"
3. Download CSV file
4. Import to Stripe, bank, or payroll system

## Testing

### Test Payout Calculation

```typescript
import { buildCleanerPayout } from '@/utils/payoutEngine';

const payout = await buildCleanerPayout(
  'cleaner_1',
  '+19731234567',
  'new_jersey',
  '2024-12-22',
  '2024-12-28'
);

// payout.netPayout should equal baseEarnings + bonusEarnings - deductions
```

### Test Weekly Generation

1. Manually trigger:
   ```bash
   POST /api/payouts/generate
   ```

2. Verify:
   - Payouts created for all cleaners with jobs
   - Base earnings calculated correctly
   - Bonuses pulled from Incentive Engine
   - Status set to "pending"

## Database Migration

### Current Implementation

- Uses in-memory mock storage
- All functions ready for DB migration
- TODO comments mark migration points

### Migration Steps

1. **Create CleanerPayouts Table** (see schema above)
2. **Update `payoutData.ts`**:
   - Replace mock storage with database queries
   - Add connection pooling
   - Implement transactions

3. **Add Foreign Keys**:
   - Link to cleaners table

4. **Add Indexes**:
   ```sql
   CREATE INDEX idx_payouts_cleaner ON cleaner_payouts(cleaner_id);
   CREATE INDEX idx_payouts_period ON cleaner_payouts(period_start, period_end);
   CREATE INDEX idx_payouts_status ON cleaner_payouts(status);
   CREATE INDEX idx_payouts_branch ON cleaner_payouts(branch);
   ```

## Scheduled Job Setup

### Option 1: Cron Job

Add to crontab:
```bash
0 9 * * 1 node /path/to/runWeeklyPayouts.js
```

### Option 2: Next.js API Route + External Scheduler

1. Create API route: `/api/payouts/generate`
2. Use external service (e.g., cron-job.org) to call endpoint weekly
3. Protect route with admin authentication

### Option 3: Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/payouts/generate",
    "schedule": "0 9 * * 1"
  }]
}
```

## Stripe/Bank Integration (Future)

### Stripe Connect

TODO: Integrate Stripe Connect for automatic payouts:
1. Connect cleaners as Stripe accounts
2. Create transfers for approved payouts
3. Update paymentReference with Stripe transfer ID
4. Set status to "paid" automatically

### Bank Transfer

TODO: Integrate bank transfer API:
1. Collect cleaner bank account details
2. Generate ACH/wire transfer files
3. Upload to bank portal
4. Update paymentReference with bank confirmation

## Access Control

**Current Status:** TODO - Admin authentication not yet implemented

**To Implement:**
1. Create admin authentication check
2. Add to `/app/dashboard/payouts/page.tsx`
3. Add to all payout API routes
4. Redirect unauthorized users

## Future Enhancements

1. **Automatic Payments**
   - Stripe Connect integration
   - Bank transfer automation
   - Payment status webhooks

2. **Deduction Rules**
   - Automatic deductions for complaints
   - Equipment damage deductions
   - Training fee deductions

3. **Payment History**
   - Detailed payment logs
   - Payment method preferences
   - Tax document generation

4. **Multi-Currency**
   - Support for different currencies
   - Exchange rate handling




