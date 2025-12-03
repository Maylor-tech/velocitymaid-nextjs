# Cleaner Scorecard - Examples & Mock Data

## Example Scorecard Data

### API Response

```json
{
  "success": true,
  "stats": {
    "cleanerId": "cleaner_1",
    "cleanerName": "John Cleaner",
    "region": "new_jersey",
    "onTimeRate": 92.5,
    "completionRate": 96.0,
    "jobsThisWeek": 8,
    "jobsThisMonth": 32,
    "customerScore": 85,
    "averageHandlingTime": 145.5,
    "earningsEstimate": 3840.00,
    "totalJobs": 50,
    "completedJobs": 48,
    "onTimeJobs": 37
  },
  "jobsByDay": [
    { "date": "2024-12-01", "count": 2 },
    { "date": "2024-12-02", "count": 1 },
    { "date": "2024-12-03", "count": 3 },
    { "date": "2024-12-04", "count": 0 },
    { "date": "2024-12-05", "count": 2 }
  ],
  "recentJobs": [
    {
      "id": "cs_test_abc123",
      "sessionId": "cs_test_abc123",
      "customerName": "John D",
      "preferredDate": "2024-12-26",
      "preferredTime": "10:00 AM",
      "serviceLocation": "new_jersey",
      "status": "completed",
      "assignedCleanerId": "cleaner_1",
      "onTheWayAt": "2024-12-26T09:45:00Z",
      "completedAt": "2024-12-26T12:15:00Z",
      "onTime": true,
      "totalPrice": 120
    }
  ]
}
```

## Example Metrics

### Excellent Performance

```typescript
{
  onTimeRate: 95.5,        // 🟢 Excellent (≥ 90%)
  completionRate: 98.0,   // 🟢 Excellent (≥ 95%)
  jobsThisWeek: 12,        // High activity
  jobsThisMonth: 45,       // High activity
  customerScore: 92,       // 🟢 Excellent (≥ 90%)
  averageHandlingTime: 120 // 2 hours average
}
```

### Fair Performance

```typescript
{
  onTimeRate: 75.0,        // 🟡 Fair (70-89%)
  completionRate: 88.0,    // 🟡 Fair (85-94%)
  jobsThisWeek: 6,         // Moderate activity
  jobsThisMonth: 24,       // Moderate activity
  customerScore: 78,      // 🟡 Fair (75-89%)
  averageHandlingTime: 180 // 3 hours average
}
```

### Needs Improvement

```typescript
{
  onTimeRate: 65.0,        // 🔴 Needs Improvement (< 70%)
  completionRate: 80.0,    // 🔴 Needs Improvement (< 85%)
  jobsThisWeek: 3,         // Low activity
  jobsThisMonth: 12,       // Low activity
  customerScore: 70,       // 🔴 Needs Improvement (< 75%)
  averageHandlingTime: 240 // 4 hours average
}
```

## UI Preview

### Scorecard Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Performance Scorecard                                  │
│  John Cleaner  [New Jersey]  [← Back to Dashboard]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ On-Time      │  │ Completion   │  │ Jobs This    │ │
│  │ Arrival      │  │ Rate         │  │ Week         │ │
│  │ 92.5%        │  │ 96.0%        │  │ 8            │ │
│  │ 🟢 Excellent │  │ 🟢 Excellent │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Jobs This    │  │ Customer     │  │ Avg Handling│ │
│  │ Month        │  │ Score        │  │ Time         │ │
│  │ 32           │  │ 85/100       │  │ 145.5 min    │ │
│  │              │  │ 🟡 Fair      │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Jobs Completed (Last 30 Days)                         │
│                                                         │
│  Dec 1: ████████ 2                                      │
│  Dec 2: ████ 1                                          │
│  Dec 3: ████████████ 3                                  │
│  Dec 4: (no jobs)                                       │
│  Dec 5: ████████ 2                                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Recent Jobs                                            │
│                                                         │
│  Job ID      Customer  Date      Region  Status  On-Time│
│  cs_test...  John D    Dec 26   [NJ]    [✓]     ✓ Yes  │
│  cs_test...  Jane S    Dec 25   [NJ]    [✓]     ✓ Yes  │
│  cs_test...  Bob T     Dec 24   [NJ]    [✓]     ✗ No   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Calculation Examples

### On-Time Arrival Calculation

**Example 1: On-Time**
- Scheduled: Dec 26, 2024 at 10:00 AM
- On The Way: Dec 26, 2024 at 9:45 AM
- Result: ✅ On-time (15 minutes early is acceptable)

**Example 2: Late**
- Scheduled: Dec 26, 2024 at 10:00 AM
- On The Way: Dec 26, 2024 at 10:20 AM
- Result: ❌ Late (20 minutes after scheduled time)

**Example 3: On-Time (Just Before)**
- Scheduled: Dec 26, 2024 at 10:00 AM
- On The Way: Dec 26, 2024 at 9:50 AM
- Result: ✅ On-time (within 15-minute buffer)

### Average Handling Time Calculation

**Job 1:**
- On The Way: 9:45 AM
- Completed: 12:15 PM
- Duration: 150 minutes

**Job 2:**
- On The Way: 2:00 PM
- Completed: 4:30 PM
- Duration: 150 minutes

**Job 3:**
- On The Way: 8:00 AM
- Completed: 10:15 AM
- Duration: 135 minutes

**Average:** (150 + 150 + 135) / 3 = 145 minutes

### Completion Rate Calculation

**Total Assigned Jobs:** 50
**Completed Jobs:** 48
**Cancelled Jobs:** 2

**Completion Rate:** (48 / 50) × 100 = 96.0%

## Performance Thresholds

### On-Time Arrival Rate

- 🟢 **Excellent**: ≥ 90%
  - Cleaner consistently arrives on time
  - Minimal customer complaints about lateness

- 🟡 **Fair**: 70-89%
  - Generally on time with occasional delays
  - May need improvement in time management

- 🔴 **Needs Improvement**: < 70%
  - Frequent late arrivals
  - Requires coaching or schedule adjustment

### Completion Rate

- 🟢 **Excellent**: ≥ 95%
  - Very reliable, rarely cancels
  - High job completion rate

- 🟡 **Fair**: 85-94%
  - Generally reliable with occasional issues
  - May need support for difficult jobs

- 🔴 **Needs Improvement**: < 85%
  - Low completion rate
  - May indicate scheduling or skill issues

### Customer Satisfaction

- 🟢 **Excellent**: ≥ 90/100
  - Consistently high ratings
  - Customers are very satisfied

- 🟡 **Fair**: 75-89/100
  - Good ratings with room for improvement
  - Some areas may need attention

- 🔴 **Needs Improvement**: < 75/100
  - Low ratings
  - Requires performance review

## Database Migration Example

### Current (Stripe Metadata)

```json
{
  "assignedCleanerPhone": "+19735556677",
  "onTheWayAt": "2024-12-26T09:45:00Z",
  "completedAt": "2024-12-26T12:15:00Z"
}
```

### Future (Database)

```sql
UPDATE jobs
SET 
  on_the_way_at = '2024-12-26 09:45:00',
  completed_at = '2024-12-26 12:15:00',
  on_time = true
WHERE id = 'job_123';
```

## Testing Scenarios

### Scenario 1: New Cleaner

- No completed jobs yet
- All metrics show 0
- Scorecard displays empty states
- Encourages cleaner to complete first job

### Scenario 2: High Performer

- 95%+ on-time rate
- 98%+ completion rate
- High job count
- All badges green
- Top of leaderboard

### Scenario 3: Improving Cleaner

- Started with low metrics
- Recent improvement trend
- Metrics moving from red → yellow → green
- Positive trajectory shown in chart

### Scenario 4: Needs Support

- Low on-time rate (< 70%)
- Low completion rate (< 85%)
- Few jobs completed
- Red badges indicate need for coaching



