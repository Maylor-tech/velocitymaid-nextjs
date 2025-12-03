# Cleaner Scorecard Performance Tracking - Setup Guide

## Overview

The Cleaner Scorecard system tracks and displays performance metrics for cleaners across New Jersey and Vermont regions. It provides insights into on-time arrival rates, completion rates, job counts, and handling times.

## Features

- **On-Time Arrival Rate**: Tracks if cleaners arrive on time for jobs
- **Completion Rate**: Percentage of assigned jobs completed
- **Job Counts**: Weekly and monthly job completion counts
- **Customer Satisfaction**: Placeholder for future review integration
- **Average Handling Time (AHT)**: Time from "on the way" to "completed"
- **Region Performance**: Aggregate stats by region
- **Performance Charts**: Visual representation of job completion over time
- **Recent Jobs Table**: Detailed view of recent jobs with on-time flags

## Routes

### Frontend Pages

- `/cleaners/scorecard` - Cleaner's personal scorecard (protected)

### API Endpoints

- `GET /api/cleaners/scorecard` - Get cleaner's scorecard data

## Metrics Explained

### 1. On-Time Arrival Rate

**Calculation:**
```
On-Time Rate = (Jobs arrived on time / Total jobs with arrival data) × 100
```

**Logic:**
- Compares `onTheWayAt` timestamp to scheduled service start time
- Allows 15-minute buffer (early arrival is considered on-time)
- Only counts jobs where cleaner marked "on the way"

**Thresholds:**
- 🟢 Excellent: ≥ 90%
- 🟡 Fair: 70-89%
- 🔴 Needs Improvement: < 70%

### 2. Completion Rate

**Calculation:**
```
Completion Rate = (Completed jobs / Total assigned jobs) × 100
```

**Logic:**
- Excludes cancelled jobs from denominator
- Counts only jobs with status "completed"

**Thresholds:**
- 🟢 Excellent: ≥ 95%
- 🟡 Fair: 85-94%
- 🔴 Needs Improvement: < 85%

### 3. Jobs This Week/Month

**Calculation:**
- Filters completed jobs by `preferredDate`
- Counts jobs in last 7 days (week) or 30 days (month)

### 4. Average Handling Time (AHT)

**Calculation:**
```
AHT = Average(completedAt - onTheWayAt) in minutes
```

**Logic:**
- Only includes completed jobs
- Calculates time difference in minutes
- Returns average across all completed jobs

### 5. Customer Satisfaction Score

**Current:** Placeholder value (85/100)
**Future:** Will integrate with customer review/rating system

### 6. Earnings Estimate

**Calculation:**
- Sum of `totalPrice` for completed jobs in current month
- Placeholder for future commission calculation

## Timestamp Tracking

The system automatically tracks timestamps when job status changes:

- **`createdAt`**: When booking was created (from Stripe session)
- **`assignedAt`**: When cleaner was assigned (from metadata)
- **`onTheWayAt`**: When cleaner marked "on the way" (set on status update)
- **`completedAt`**: When cleaner marked "completed" (set on status update)

These timestamps are stored in Stripe metadata and used for performance calculations.

## Data Sources

### Current Implementation

- Uses Stripe Checkout Sessions as data source
- Reads from session metadata
- Matches jobs by `assignedCleanerPhone`

### Future Database Migration

When moving to database:

1. **Create Jobs Table**
   ```sql
   CREATE TABLE jobs (
     id UUID PRIMARY KEY,
     session_id VARCHAR(255) UNIQUE,
     assigned_cleaner_id UUID REFERENCES cleaners(id),
     customer_name VARCHAR(255),
     preferred_date DATE,
     preferred_time VARCHAR(50),
     service_location VARCHAR(20),
     status VARCHAR(50),
     created_at TIMESTAMP,
     assigned_at TIMESTAMP,
     on_the_way_at TIMESTAMP,
     completed_at TIMESTAMP,
     total_price DECIMAL(10,2),
     on_time BOOLEAN
   );
   ```

2. **Update Queries**
   - Replace Stripe API calls with database queries
   - Add indexes for performance:
     ```sql
     CREATE INDEX idx_jobs_cleaner ON jobs(assigned_cleaner_id);
     CREATE INDEX idx_jobs_date ON jobs(preferred_date);
     CREATE INDEX idx_jobs_status ON jobs(status);
     ```

## Testing

### Access Scorecard

1. Login as cleaner: `/cleaners/login`
2. Click "View Scorecard" button in dashboard
3. Or navigate directly: `/cleaners/scorecard`

### Test Metrics

To see meaningful metrics:

1. Assign jobs to cleaner via `/api/bookings/assign-cleaner`
2. Cleaner marks jobs as "on the way"
3. Cleaner marks jobs as "completed"
4. View scorecard to see updated metrics

### Mock Data

If no real data exists, metrics will show:
- 0% completion rate
- 0 jobs this week/month
- 0 average handling time

## Performance Badges

The system uses color-coded badges:

- **Green**: Excellent performance (meets or exceeds threshold)
- **Yellow**: Fair performance (below excellent but above minimum)
- **Red**: Needs improvement (below minimum threshold)

## Components

### StatCard
- Displays KPI metrics
- Color-coded based on performance
- Shows icon and subtitle

### PerformanceChart
- Bar chart of jobs completed by day
- Last 30 days
- Visual representation of activity

### JobsTable
- Recent jobs with details
- Shows on-time flag
- Status and region badges

### MetricBadge
- Color-coded performance indicator
- Formats values (percentage, time, count)
- Threshold-based coloring

## Integration Points

### Cleaner Portal

- Accessible from dashboard via "View Scorecard" button
- Shows personal performance metrics
- Real-time updates when jobs are completed

### Admin Dashboard (Future)

- Leaderboard of top performers
- Region comparison
- Performance alerts
- Bulk performance reports

## Troubleshooting

### No Metrics Showing

- Ensure jobs are assigned to cleaner
- Verify cleaner has completed jobs
- Check that timestamps are being tracked
- Verify `assignedCleanerPhone` matches in Stripe metadata

### Incorrect On-Time Rate

- Check that `onTheWayAt` timestamp is set
- Verify `preferredDate` and `preferredTime` are correct
- Ensure time zone handling is correct

### Missing Timestamps

- Timestamps are set automatically when status changes
- If missing, may need to update existing jobs manually
- Future jobs will have timestamps tracked automatically

## Future Enhancements

1. **Customer Reviews Integration**
   - Replace placeholder customer score
   - Calculate from actual ratings
   - Show review count

2. **Advanced Analytics**
   - Trend analysis
   - Performance over time charts
   - Comparison with team averages

3. **Notifications**
   - Alert cleaners of low performance
   - Celebrate milestones
   - Weekly performance summaries

4. **Gamification**
   - Performance badges
   - Leaderboards
   - Achievement unlocks

5. **Export Functionality**
   - PDF reports
   - CSV export
   - Email summaries



