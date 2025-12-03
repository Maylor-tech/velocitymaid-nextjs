# Branch Profitability Dashboard - Setup Guide

## Overview

The Branch Profitability Dashboard provides financial and operational metrics comparing New Jersey vs Vermont branches. It shows revenue, cost estimates, profit margins, and trends over time.

## Features

- **Revenue Tracking**: Total revenue by branch and date range
- **Cost Estimation**: Simple cost model based on service type
- **Profit Calculation**: Revenue minus estimated costs
- **Margin Analysis**: Profit margin percentage by branch
- **Trend Visualization**: Revenue trends over time
- **Comparison View**: Side-by-side branch comparison

## Routes

### Frontend Pages

- `/dashboard/profit` - Branch profitability dashboard (admin-only)

### API Endpoints

- `GET /api/dashboard/profit?range=today|week|month` - Fetch profitability data

## Cost Model

The system uses a simple cost estimation model:

- **Basic Clean**: 50% of revenue
- **Deep Clean**: 55% of revenue
- **Move In/Out Clean**: 60% of revenue
- **Default**: 50% of revenue

### Cost Calculation

```typescript
if (serviceType === 'basic') {
  cost = totalPrice * 0.5;
} else if (serviceType === 'deep') {
  cost = totalPrice * 0.55;
} else if (serviceType === 'moveInOut') {
  cost = totalPrice * 0.6;
} else {
  cost = totalPrice * 0.5; // Default
}
```

### Profit & Margin

```typescript
profit = revenue - costEstimate;
margin = (profit / revenue) * 100;
```

## Date Ranges

- **Today**: Jobs completed today
- **This Week**: Jobs completed in last 7 days
- **This Month**: Jobs completed in last 30 days

## Access Control

**Current Status**: TODO - Admin authentication not yet implemented

**To Add Admin Protection:**

1. Create admin authentication check
2. Add to `/app/dashboard/profit/page.tsx`:
   ```typescript
   import { useAuth } from '@/hooks/useAuth';
   
   if (!isAdmin) {
     redirect('/');
   }
   ```

3. Add to `/app/api/dashboard/profit/route.ts`:
   ```typescript
   if (!isAdmin(request)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
   }
   ```

## Data Sources

### Current Implementation

- Uses Stripe Checkout Sessions
- Reads from session metadata
- Filters by `serviceLocation` and `completed` status
- Only includes completed jobs

### Required Fields

Each job must have:
- `serviceLocation`: "new_jersey" | "vermont"
- `serviceType`: "basic" | "deep" | "moveInOut"
- `totalPrice`: number
- `preferredDate`: Date string
- `status`: "completed" (filtered)
- `completedAt`: Timestamp (optional, uses created date if missing)

## Testing

### Quick Test

1. Navigate to: `http://localhost:3000/dashboard/profit`
2. Select date range (Today/Week/Month)
3. Verify data loads and displays correctly

### Test with Data

To see meaningful data:

1. Ensure you have completed jobs in Stripe
2. Jobs must have `serviceLocation` in metadata
3. Jobs must have `completed: "true"` in metadata
4. Select appropriate date range

## Database Migration Notes

### Current Implementation

- Uses Stripe as data source
- Reads from session metadata
- No separate database required

### Future Migration

When moving to database:

1. **Create Jobs Table**
   ```sql
   CREATE TABLE jobs (
     id UUID PRIMARY KEY,
     session_id VARCHAR(255) UNIQUE,
     service_location VARCHAR(20) NOT NULL,
     service_type VARCHAR(50) NOT NULL,
     total_price DECIMAL(10,2) NOT NULL,
     preferred_date DATE NOT NULL,
     status VARCHAR(50) NOT NULL,
     created_at TIMESTAMP,
     completed_at TIMESTAMP,
     duration_minutes INTEGER
   );
   ```

2. **Add Indexes**
   ```sql
   CREATE INDEX idx_jobs_location ON jobs(service_location);
   CREATE INDEX idx_jobs_date ON jobs(preferred_date);
   CREATE INDEX idx_jobs_status ON jobs(status);
   CREATE INDEX idx_jobs_completed ON jobs(completed_at) WHERE status = 'completed';
   ```

3. **Update Queries**
   - Replace `fetchCompletedJobs()` with database query
   - Use SQL aggregations for better performance
   - Add caching for frequently accessed data

4. **Update `branchProfitQueries.ts`**
   ```typescript
   // Replace fetchCompletedJobs() with:
   async function fetchCompletedJobs(range: DateRange): Promise<JobRecord[]> {
     const { start, end } = getDateRange(range);
     const result = await db.query(`
       SELECT * FROM jobs
       WHERE status = 'completed'
       AND preferred_date BETWEEN $1 AND $2
     `, [start, end]);
     return result.rows;
   }
   ```

## Extending to More States

### Adding New Branches

1. **Update Type Definitions**
   ```typescript
   // In branchProfitQueries.ts
   export type ServiceRegion = 'new_jersey' | 'vermont' | 'new_york' | 'massachusetts';
   ```

2. **Update Branch Revenue Function**
   ```typescript
   export async function getBranchRevenue(range: DateRange): Promise<BranchRevenueData> {
     const jobs = await fetchCompletedJobs(range);
     
     return {
       new_jersey: { jobs: ..., revenue: ... },
       vermont: { jobs: ..., revenue: ... },
       new_york: { jobs: ..., revenue: ... },  // Add new branch
       massachusetts: { jobs: ..., revenue: ... },  // Add new branch
     };
   }
   ```

3. **Update Components**
   - Add new branch to `BranchComparison` component
   - Update `BranchBreakdownTable` to show all branches
   - Add branch badge colors in `BranchSummaryCard`

4. **Update UI**
   - Modify grid layout to accommodate more branches
   - Add branch selector if needed
   - Update trend chart to show all branches

### Example: Adding New York

```typescript
// 1. Update type
export type ServiceRegion = 'new_jersey' | 'vermont' | 'new_york';

// 2. Update revenue calculation
const nyJobs = jobs.filter(job => job.serviceLocation === 'new_york');
return {
  new_jersey: { jobs: njJobs.length, revenue: ... },
  vermont: { jobs: vtJobs.length, revenue: ... },
  new_york: { jobs: nyJobs.length, revenue: nyJobs.reduce(...) },
};

// 3. Add badge color
const badgeColor = branch === 'new_jersey' ? 'bg-blue-100' :
                   branch === 'vermont' ? 'bg-green-100' :
                   'bg-purple-100'; // New York
```

## Troubleshooting

### No Data Showing

- Check that jobs have `serviceLocation` in metadata
- Verify jobs are marked as `completed: "true"`
- Ensure date range includes job dates
- Check Stripe API connection

### Incorrect Calculations

- Verify cost model percentages are correct
- Check that `totalPrice` is in correct format (dollars, not cents)
- Ensure profit calculation: `revenue - costEstimate`
- Verify margin calculation handles division by zero

### Performance Issues

- Consider caching for large date ranges
- Add database indexes when migrating
- Limit date range for initial load
- Use pagination for large datasets

## Future Enhancements

1. **Advanced Cost Model**
   - Actual labor costs
   - Material costs
   - Overhead allocation
   - Variable vs fixed costs

2. **More Metrics**
   - Customer acquisition cost
   - Lifetime value
   - Return on investment
   - Break-even analysis

3. **Forecasting**
   - Revenue projections
   - Profit forecasts
   - Trend predictions
   - Seasonal analysis

4. **Export Functionality**
   - PDF reports
   - CSV export
   - Email summaries
   - Scheduled reports



