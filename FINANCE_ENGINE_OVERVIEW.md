# Finance Engine Overview

## Phase 7 — Revenue & Payout Engine

This document provides an overview of the finance engine implementation, including APIs, utilities, and UI components.

---

## Architecture

The finance engine is organized into several key components:

1. **Core Utilities** (`lib/finance/`)
   - Cost modeling
   - Payout calculations
   - Pricing intelligence
   - Health score calculations

2. **API Routes** (`app/api/admin/finance/` and `app/api/admin/payouts/`)
   - Finance overview endpoint
   - Payout preview endpoint

3. **Admin UI** (`app/admin/profitability/` and `app/admin/payouts/`)
   - Revenue & Profitability Dashboard
   - Enhanced Payout Management

---

## Part A: Revenue & Profitability Dashboard

### API: `/api/admin/finance/overview`

**Endpoint:** `GET /api/admin/finance/overview`

**Query Parameters:**
- `branchId` (optional): Branch ID to filter by
- `range` (optional): Date range (`today`, `7d`, `30d`, `90d`, `custom`)
- `from` (optional): Start date (ISO format, required if `range=custom`)
- `to` (optional): End date (ISO format, required if `range=custom`)

**Response:**
```typescript
{
  branch: { id: string; name: string; slug: string };
  range: { from: string; to: string };
  kpis: {
    revenueTotal: number;
    jobsCompleted: number;
    jobsCancelled: number;
    averageTicket: number;
    revenuePerJob: number;
    revenuePerCleaner: number | null;
    laborCost: number;
    suppliesCost: number;
    otherCost: number;
    totalCost: number;
    profit: number;
    profitMargin: number; // percentage
  };
  trends: {
    revenueByDay: Array<{ date: string; revenue: number }>;
    jobsByDay: Array<{ date: string; jobs: number }>;
  };
  byServiceType: Array<{
    label: string;
    jobs: number;
    revenue: number;
  }>;
  branchesSummary: Array<{
    branchId: string;
    name: string;
    revenue: number;
    profit: number;
  }>;
  health: {
    score: number; // 0-100
    level: 'CRITICAL' | 'WEAK' | 'STABLE' | 'HEALTHY' | 'EXCELLENT';
    recommendations: string[];
  };
}
```

**Features:**
- Revenue KPIs (total, per job, per cleaner)
- Cost breakdown (labor, supplies, other)
- Profit and profit margin
- Daily revenue and job trends
- Service type breakdown
- Branch comparison
- Financial health score

### UI: `/admin/profitability`

**Location:** `app/admin/profitability/page.tsx`

**Features:**
- Branch selector
- Date range selector (Today, 7d, 30d, 90d, Custom)
- KPI cards (Revenue, Profit, Margin, Jobs, Avg Ticket, Revenue/Cleaner)
- Branch Financial Health Score card
- Cost breakdown section
- Revenue trend chart (simple bar chart)
- Service type breakdown table
- Branch comparison table
- Auto-refresh every 60 seconds

---

## Part B: Cleaner Payout Engine

### API: `/api/admin/payouts/preview`

**Endpoint:** `GET /api/admin/payouts/preview`

**Query Parameters:**
- `branchId` (optional): Branch ID to filter by
- `from` (required): Start date (ISO format)
- `to` (required): End date (ISO format)

**Response:**
```typescript
{
  success: boolean;
  branch: { id: string; name: string };
  range: { from: string; to: string };
  cleaners: Array<{
    cleanerId: string;
    cleanerName: string;
    cleanerEmail: string;
    jobsCount: number;
    grossEarnings: number;
    bonuses: number;
    penalties: number;
    netEarnings: number;
  }>;
  totals: {
    jobsCount: number;
    grossEarnings: number;
    bonuses: number;
    penalties: number;
    netEarnings: number;
    averagePayout: number;
  };
}
```

**Logic:**
- Finds all completed jobs in the date range
- Calculates cleaner share per job (uses `BranchPayoutRules` if available, otherwise defaults to 55%)
- Applies bonuses and penalties (currently returns 0, ready for future incentive/penalty models)
- Computes net earnings per cleaner
- Returns sorted list (by net earnings, descending)

### UI: Enhanced `/admin/payouts`

**Location:** `app/admin/payouts/page.tsx`

**New Features:**
- **Payout Preview Section:**
  - Date range selector (from/to)
  - "Preview Payouts" button
  - Table showing cleaner earnings breakdown
  - "Download CSV" button (client-side export)
- **Existing Features:**
  - View existing payout records
  - Filter by branch, status, date range
  - Mark payouts as paid

---

## Part C: Cost Modeling Engine

### Utility: `lib/finance/costModel.ts`

**Functions:**
- `computeCostForJobs(args)`: Calculates cost breakdown for a set of jobs
- `getBranchCostConfig(branchId)`: Retrieves branch-specific cost configuration

**Default Rates:**
- Labor: 55% of revenue
- Supplies: 5% of revenue
- Other: 10% of revenue
- Total: 70% of revenue

**Usage:**
```typescript
import { computeCostForJobs } from '@/lib/finance/costModel';

const costBreakdown = computeCostForJobs({
  jobs: [{ id: '1', amount: 100 }, { id: '2', amount: 150 }],
  branchConfig: {
    laborRate: 0.55,
    suppliesRate: 0.05,
    otherRate: 0.10,
  },
});
// Returns: { laborCost: 137.5, suppliesCost: 12.5, otherCost: 25, totalCost: 175 }
```

**Future Enhancement:**
- If `Branch` model gets a `financeConfig` JSON field, `getBranchCostConfig` will parse it
- Currently returns empty object to use defaults

---

## Part D: Job Pricing Intelligence

### Utility: `lib/finance/pricing.ts`

**Functions:**
- `calculateJobPrice(input, config?)`: Calculates job price with breakdown
- `getRecommendedBaseRate(serviceType?)`: Returns recommended base rate by service type

**Pricing Logic:**
1. **Base Rate:** From input or service type default
2. **Size Adjustment:**
   - If `squareFeet` available: `squareFeet * sqFtRate`
   - Otherwise: `bedrooms * bedroomRate + bathrooms * bathroomRate`
3. **Type Adjustment:**
   - Deep clean: multiply by `deepCleanMultiplier` (default 1.5)
   - Move-out: multiply by `moveOutMultiplier` (default 1.3)
4. **Travel Fee:** `min(travelDistanceKm * travelRatePerKm, maxTravelFee)`
5. **Discount:** `subtotal * defaultDiscountRate` (default 0)
6. **Total:** `subtotal - discount`

**Default Configuration:**
- Bedroom rate: $15 per bedroom
- Bathroom rate: $10 per bathroom
- Square footage rate: $0.05 per sq ft
- Deep clean multiplier: 1.5x
- Move-out multiplier: 1.3x
- Travel rate: $0.50 per km
- Max travel fee: $25

**Usage:**
```typescript
import { calculateJobPrice } from '@/lib/finance/pricing';

const breakdown = calculateJobPrice({
  baseRate: 80,
  bedrooms: 3,
  bathrooms: 2,
  isDeepClean: true,
  travelDistanceKm: 10,
});
// Returns breakdown with base, sizeAdjustment, typeAdjustment, travelFee, discount, total
```

**UI Integration:**
- Currently available as utility functions
- Can be integrated into job creation forms or pricing modals
- See `lib/finance/pricing.ts` for full API

---

## Part E: Branch Financial Health Score

### Utility: `lib/finance/healthScore.ts`

**Functions:**
- `calculateBranchHealthScore(inputs)`: Calculates health score from financial inputs
- `calculateRevenueTrendSlope(revenueByDay)`: Calculates revenue trend using linear regression

**Scoring Logic:**
- Starts at 50 points
- **Profit Margin:**
  - < 0: -20
  - 0-10%: -10
  - 10-20%: 0
  - 20-30%: +10
  - 30%+: +20
- **Revenue Trend:**
  - Negative (< -0.1): -10
  - Stable (-0.1 to 0.05): 0
  - Growing (0.05+): +10
- **Unassigned Rate:**
  - 20%+: -15
  - 10-20%: -5
  - < 10%: +5
- **Complaint Rate:**
  - 10%+: -20
  - 5-10%: -10
  - < 5%: +5
- **Payout/Revenue Ratio:**
  - 70%+: -10
  - 50-70%: 0
  - 30-50%: +5
  - < 30%: +5

**Score Levels:**
- 0-39: CRITICAL
- 40-54: WEAK
- 55-69: STABLE
- 70-84: HEALTHY
- 85-100: EXCELLENT

**Recommendations:**
- Automatically generated based on weak spots
- Max 4 recommendations per score

**Usage:**
```typescript
import { calculateBranchHealthScore } from '@/lib/finance/healthScore';

const health = calculateBranchHealthScore({
  profitMargin: 0.25,
  revenueTrendSlope: 0.05,
  unassignedRate: 0.05,
  complaintRate: 0.02,
  payoutToRevenueRatio: 0.55,
});
// Returns: { score: 75, level: 'HEALTHY', recommendations: [...] }
```

---

## Integration Points

### Where to Plug in Real Integrations

1. **Stripe Integration:**
   - Replace `Job.totalPrice` with actual Stripe payment amounts
   - Add payment status tracking
   - Integrate refund handling

2. **Payroll Integration:**
   - Replace payout preview with actual payroll API calls
   - Add bank transfer/payment processing
   - Implement payout finalization workflow

3. **Incentive/Bonus Models:**
   - Update `applyBonusesAndPenalties()` in `lib/finance/payouts.ts`
   - Query `Incentive`, `Bonus`, or similar models
   - Calculate based on cleaner performance metrics

4. **Complaint/Penalty Models:**
   - Update `applyBonusesAndPenalties()` to query `Complaint` model
   - Calculate penalties based on complaint severity
   - Update health score complaint rate calculation

5. **Branch Cost Configuration:**
   - Add `financeConfig` JSON field to `Branch` model (if needed)
   - Update `getBranchCostConfig()` to parse and return custom rates
   - Allow admins to configure rates per branch

---

## File Structure

```
lib/finance/
├── costModel.ts          # Cost calculation utilities
├── payouts.ts            # Payout calculation helpers
├── pricing.ts            # Job pricing intelligence
└── healthScore.ts        # Financial health scoring

app/api/admin/finance/
└── overview/
    └── route.ts          # Finance overview API

app/api/admin/payouts/
└── preview/
    └── route.ts          # Payout preview API

app/admin/
├── profitability/
│   └── page.tsx          # Revenue & Profitability Dashboard
└── payouts/
    └── page.tsx          # Enhanced Payout Management
```

---

## Testing

### Manual Testing Checklist

1. **Finance Overview:**
   - [ ] Navigate to `/admin/profitability`
   - [ ] Select different date ranges
   - [ ] Verify KPI cards show correct values
   - [ ] Check health score calculation
   - [ ] Verify revenue trend chart displays
   - [ ] Test branch comparison table

2. **Payout Preview:**
   - [ ] Navigate to `/admin/payouts`
   - [ ] Select date range (from/to)
   - [ ] Click "Preview Payouts"
   - [ ] Verify cleaner earnings breakdown
   - [ ] Test CSV download
   - [ ] Verify totals row

3. **Cost Model:**
   - [ ] Verify cost breakdown in finance overview
   - [ ] Check labor/supplies/other costs sum to total
   - [ ] Verify profit = revenue - total cost

4. **Health Score:**
   - [ ] Verify health score appears in profitability dashboard
   - [ ] Check recommendations are relevant
   - [ ] Verify score level matches score value

---

## Future Enhancements

1. **Real-time Updates:**
   - WebSocket integration for live finance updates
   - Push notifications for significant changes

2. **Advanced Analytics:**
   - Cohort analysis
   - Predictive revenue forecasting
   - Customer lifetime value

3. **Automated Payouts:**
   - Scheduled payout generation
   - Integration with payment processors
   - Automated bank transfers

4. **Custom Pricing Rules:**
   - Per-branch pricing configurations
   - Dynamic pricing based on demand
   - Customer-specific pricing tiers

5. **Expense Tracking:**
   - Manual expense entry
   - Receipt upload and OCR
   - Expense categorization

---

## Notes

- All calculations use defensive null handling
- Empty datasets return zeros or empty arrays (no errors)
- TypeScript types are fully defined
- No Prisma schema changes in this phase
- Ready for integration with external payment/payroll systems

















