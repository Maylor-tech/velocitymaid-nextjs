# Cleaner Payouts System - Examples & Outputs

## Example Payout Data

### Payout Object

```typescript
{
  id: "payout_1703616000000_abc123",
  cleanerId: "cleaner_1",
  periodStart: "2024-12-22",
  periodEnd: "2024-12-28",
  branch: "new_jersey",
  totalJobs: 8,
  baseEarnings: 520.00,
  bonusEarnings: 60.00,
  deductions: 0.00,
  netPayout: 580.00,
  status: "pending",
  paymentMethod: null,
  paymentReference: null,
  createdAt: "2024-12-29T09:00:00Z",
  updatedAt: "2024-12-29T09:00:00Z",
  paidAt: null
}
```

### Paid Payout Example

```typescript
{
  id: "payout_1703616000000_def456",
  cleanerId: "cleaner_2",
  periodStart: "2024-12-22",
  periodEnd: "2024-12-28",
  branch: "vermont",
  totalJobs: 12,
  baseEarnings: 840.00,
  bonusEarnings: 84.00,
  deductions: 0.00,
  netPayout: 924.00,
  status: "paid",
  paymentMethod: "stripe",
  paymentReference: "tr_1234567890",
  createdAt: "2024-12-29T09:00:00Z",
  updatedAt: "2024-12-30T14:30:00Z",
  paidAt: "2024-12-30T14:30:00Z"
}
```

## Payout Calculation Examples

### Example 1: Basic Clean Jobs

```typescript
// Cleaner completed 10 basic clean jobs
// Base pay: 10 × $50 = $500
// Bonus: Gold tier, 10 jobs = $50
// Deductions: $0

const payout = {
  totalJobs: 10,
  baseEarnings: 500.00,
  bonusEarnings: 50.00,
  deductions: 0.00,
  netPayout: 550.00,
};
```

### Example 2: Mixed Service Types

```typescript
// Cleaner completed:
// - 5 basic cleans: 5 × $50 = $250
// - 3 deep cleans: 3 × $80 = $240
// - 2 move-in/out: 2 × $110 = $220
// Total base: $710
// Bonus: Platinum tier, 10 jobs = $70
// Deductions: $0

const payout = {
  totalJobs: 10,
  baseEarnings: 710.00,
  bonusEarnings: 70.00,
  deductions: 0.00,
  netPayout: 780.00,
};
```

### Example 3: With Deductions

```typescript
// Base earnings: $500
// Bonus: $50
// Deductions: $25 (equipment damage)

const payout = {
  totalJobs: 10,
  baseEarnings: 500.00,
  bonusEarnings: 50.00,
  deductions: 25.00,
  netPayout: 525.00,
};
```

## API Request/Response Examples

### List Payouts

```bash
GET /api/payouts/list?periodStart=2024-12-22&periodEnd=2024-12-28&status=pending
```

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout_1703616000000_abc123",
      "cleanerId": "cleaner_1",
      "periodStart": "2024-12-22",
      "periodEnd": "2024-12-28",
      "branch": "new_jersey",
      "totalJobs": 8,
      "baseEarnings": 520.00,
      "bonusEarnings": 60.00,
      "deductions": 0.00,
      "netPayout": 580.00,
      "status": "pending",
      "paymentMethod": null,
      "paymentReference": null,
      "createdAt": "2024-12-29T09:00:00Z",
      "updatedAt": "2024-12-29T09:00:00Z",
      "paidAt": null
    }
  ],
  "count": 1
}
```

### Update Payout

```bash
PATCH /api/payouts/update
{
  "payoutId": "payout_1703616000000_abc123",
  "status": "approved",
  "deductions": 25.00,
  "paymentMethod": "stripe"
}
```

**Response:**
```json
{
  "success": true,
  "payout": {
    "id": "payout_1703616000000_abc123",
    "status": "approved",
    "deductions": 25.00,
    "netPayout": 555.00,
    "paymentMethod": "stripe",
    ...
  }
}
```

### Generate Payouts

```bash
POST /api/payouts/generate
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalProcessed": 10,
    "totalNetPayouts": 4500.00,
    "payoutsByRegion": {
      "new_jersey": 2800.00,
      "vermont": 1700.00
    },
    "cleanersWithPayouts": 8,
    "results": [...]
  },
  "message": "Weekly payout generation completed successfully"
}
```

## CSV Export Example

### CSV Format

```csv
"Cleaner Name","Cleaner ID","Branch","Period Start","Period End","Net Payout","Payment Method","Payment Reference","Status"
"John Cleaner","cleaner_1","New Jersey","2024-12-22","2024-12-28","580.00","stripe","tr_1234567890","paid"
"Jane Cleaner","cleaner_2","Vermont","2024-12-22","2024-12-28","924.00","bank_transfer","ACH-2024-12-30-001","paid"
```

### Export URL

```
GET /api/payouts/export?periodStart=2024-12-22&periodEnd=2024-12-28&status=paid
```

## UI Preview

### Admin Payout Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Cleaner Payouts — Weekly Earnings & Approvals         │
│  [Export CSV]                                           │
└─────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Total    │ │ NJ Total │ │ VT Total │ │ Cleaners │ │ Avg      │
│ Payouts  │ │          │ │          │ │          │ │ Payout   │
│ $4,500   │ │ $2,800   │ │ $1,700   │ │ 8        │ │ $562.50  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────────┐
│  Filters                                                │
│  Period: [This Week] [1 Week Ago] [2 Weeks Ago] ...    │
│  Status: [All] [Pending] [Approved] [Paid]             │
│  Branch: [All] [New Jersey] [Vermont]                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Payouts                                                │
├─────────────────────────────────────────────────────────┤
│  Cleaner  Branch  Period      Jobs  Base  Bonus  Net   │
│  John C   [NJ]    Dec 22-28   8     $520  $60    $580  │
│           [View] [Approve]                              │
└─────────────────────────────────────────────────────────┘
```

### Cleaner Earnings Page

```
┌─────────────────────────────────────────────────────────┐
│  My Earnings                                            │
│  View your payout history and earnings                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Current Week                                            │
│  Dec 22, 2024 - Dec 28, 2024    Net Payout: $580.00    │
│                                                         │
│  Status: [Pending]  Base: $520.00  Bonus: $60.00       │
│  Branch: [New Jersey]                                   │
└─────────────────────────────────────────────────────────┘

[View Performance Details] → /cleaners/scorecard

┌─────────────────────────────────────────────────────────┐
│  Earnings History                                        │
├─────────────────────────────────────────────────────────┤
│  Period          Net Payout  Status    Payment  Ref    │
│  Dec 22-28       $580.00     Pending   —        —      │
│  Dec 15-21       $550.00     Paid      Stripe   tr_... │
│  Dec 8-14        $500.00     Paid      Bank     ACH... │
└─────────────────────────────────────────────────────────┘
```

## Database Query Examples

### When Migrating to Database

```sql
-- Create payout
INSERT INTO cleaner_payouts (
  cleaner_id, period_start, period_end, branch,
  total_jobs, base_earnings, bonus_earnings,
  deductions, net_payout, status
) VALUES (
  'cleaner_1',
  '2024-12-22',
  '2024-12-28',
  'new_jersey',
  8,
  520.00,
  60.00,
  0.00,
  580.00,
  'pending'
);

-- Get payouts for period
SELECT * FROM cleaner_payouts
WHERE period_start = '2024-12-22'
  AND period_end = '2024-12-28'
ORDER BY net_payout DESC;

-- Update payout status
UPDATE cleaner_payouts
SET 
  status = 'paid',
  payment_method = 'stripe',
  payment_reference = 'tr_1234567890',
  paid_at = NOW(),
  updated_at = NOW()
WHERE id = 'payout_123';

-- Calculate total payouts by branch
SELECT 
  branch,
  COUNT(*) as payout_count,
  SUM(net_payout) as total_payouts
FROM cleaner_payouts
WHERE period_start = '2024-12-22'
GROUP BY branch;
```

## Weekly Generation Flow

```
Monday 9:00 AM (Cron)
    ↓
Get Last Week Range (Mon-Sun)
    ↓
For Each Cleaner:
    ↓
Fetch Completed Jobs
    ↓
Calculate Base Earnings
    ↓
Get Bonus from Incentive Engine
    ↓
Calculate Net Payout
    ↓
Create Payout Record (status: pending)
    ↓
Send Email to Admin
```

## Mock Data Examples

### Example Payouts

```typescript
// Pending Payout
{
  id: "payout_1",
  cleanerId: "cleaner_1",
  periodStart: "2024-12-22",
  periodEnd: "2024-12-28",
  branch: "new_jersey",
  totalJobs: 8,
  baseEarnings: 520.00,
  bonusEarnings: 60.00,
  deductions: 0.00,
  netPayout: 580.00,
  status: "pending",
  paymentMethod: null,
  paymentReference: null,
  createdAt: "2024-12-29T09:00:00Z",
  updatedAt: "2024-12-29T09:00:00Z",
  paidAt: null
}

// Paid Payout
{
  id: "payout_2",
  cleanerId: "cleaner_2",
  periodStart: "2024-12-22",
  periodEnd: "2024-12-28",
  branch: "vermont",
  totalJobs: 12,
  baseEarnings: 840.00,
  bonusEarnings: 84.00,
  deductions: 0.00,
  netPayout: 924.00,
  status: "paid",
  paymentMethod: "stripe",
  paymentReference: "tr_1234567890",
  createdAt: "2024-12-29T09:00:00Z",
  updatedAt: "2024-12-30T14:30:00Z",
  paidAt: "2024-12-30T14:30:00Z"
}
```



