# Branch Profitability - Examples & Mock Data

## Example API Response

```json
{
  "success": true,
  "range": "month",
  "data": {
    "revenue": {
      "new_jersey": {
        "jobs": 45,
        "revenue": 5400.00
      },
      "vermont": {
        "jobs": 32,
        "revenue": 3840.00
      }
    },
    "averages": {
      "new_jersey": {
        "avgRevenuePerJob": 120.00
      },
      "vermont": {
        "avgRevenuePerJob": 120.00
      }
    },
    "trends": {
      "dates": ["2024-12-01", "2024-12-02", "2024-12-03"],
      "new_jersey": [450.00, 680.00, 520.00],
      "vermont": [320.00, 240.00, 380.00]
    },
    "profitability": {
      "new_jersey": {
        "revenue": 5400.00,
        "costEstimate": 2700.00,
        "profit": 2700.00,
        "margin": 50.0
      },
      "vermont": {
        "revenue": 3840.00,
        "costEstimate": 1920.00,
        "profit": 1920.00,
        "margin": 50.0
      }
    }
  },
  "timestamp": "2024-12-26T10:30:00Z"
}
```

## Example Cost Calculations

### Basic Clean Job

```typescript
totalPrice: 120.00
serviceType: "basic"
costEstimate: 120.00 * 0.5 = 60.00
profit: 120.00 - 60.00 = 60.00
margin: (60.00 / 120.00) * 100 = 50%
```

### Deep Clean Job

```typescript
totalPrice: 220.00
serviceType: "deep"
costEstimate: 220.00 * 0.55 = 121.00
profit: 220.00 - 121.00 = 99.00
margin: (99.00 / 220.00) * 100 = 45%
```

### Move In/Out Clean Job

```typescript
totalPrice: 320.00
serviceType: "moveInOut"
costEstimate: 320.00 * 0.6 = 192.00
profit: 320.00 - 192.00 = 128.00
margin: (128.00 / 320.00) * 100 = 40%
```

## Example Branch Comparison

### New Jersey (This Month)

```
Jobs: 45
Revenue: $5,400.00
Avg per Job: $120.00
Cost Estimate: $2,700.00
Profit: $2,700.00
Margin: 50.0%
```

### Vermont (This Month)

```
Jobs: 32
Revenue: $3,840.00
Avg per Job: $120.00
Cost Estimate: $1,920.00
Profit: $1,920.00
Margin: 50.0%
```

### Comparison

- **Total Jobs**: 77 (45 NJ + 32 VT)
- **Total Revenue**: $9,240.00
- **Total Profit**: $4,620.00
- **Overall Margin**: 50.0%

## UI Preview

```
┌─────────────────────────────────────────────────────────┐
│  Branch Profitability — VelocityMaid                    │
│  Financial and operational metrics by branch             │
└─────────────────────────────────────────────────────────┘

[ Today ] [ This Week ] [ This Month ] ← Selected

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ NJ       │ │ NJ Cost  │ │ NJ Profit│ │ NJ Margin│
│ Revenue  │ │ Estimate │ │          │ │          │
│ $5,400   │ │ $2,700   │ │ $2,700   │ │ 50.0%    │
│ 45 jobs  │ │          │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ VT       │ │ VT Cost  │ │ VT Profit│ │ VT Margin│
│ Revenue  │ │ Estimate │ │          │ │          │
│ $3,840   │ │ $1,920   │ │ $1,920   │ │ 50.0%    │
│ 32 jobs  │ │          │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────┐ ┌─────────────────────────────┐
│  New Jersey Snapshot         │ │  Vermont Snapshot           │
│  [New Jersey]                │ │  [Vermont]                 │
│                              │ │                             │
│  Jobs: 45                    │ │  Jobs: 32                   │
│  Revenue: $5,400.00          │ │  Revenue: $3,840.00        │
│  Avg per Job: $120.00        │ │  Avg per Job: $120.00      │
│  Profit Margin: 50.0%        │ │  Profit Margin: 50.0%       │
│                              │ │                             │
│  Profit: +$2,700.00          │ │  Profit: +$1,920.00        │
└─────────────────────────────┘ └─────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Revenue Trends                                         │
│                                                         │
│  Dec 1: ████████████ $770 (NJ: $450, VT: $320)        │
│  Dec 2: ████████████████ $920 (NJ: $680, VT: $240)    │
│  Dec 3: ██████████████ $900 (NJ: $520, VT: $380)      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Branch Breakdown                                       │
│                                                         │
│  Branch      Jobs  Revenue    Cost      Profit  Margin │
│  New Jersey  45    $5,400.00  $2,700.00 +$2,700 50.0% │
│  Vermont     32    $3,840.00  $1,920.00 +$1,920 50.0% │
│  ───────────────────────────────────────────────────── │
│  Total       77    $9,240.00  $4,620.00 +$4,620 50.0% │
└─────────────────────────────────────────────────────────┘
```

## Mock Data Example

### Sample Jobs

```typescript
// New Jersey Jobs
[
  {
    id: "cs_test_1",
    serviceLocation: "new_jersey",
    serviceType: "basic",
    totalPrice: 120.00,
    preferredDate: "2024-12-26",
    status: "completed"
  },
  {
    id: "cs_test_2",
    serviceLocation: "new_jersey",
    serviceType: "deep",
    totalPrice: 220.00,
    preferredDate: "2024-12-25",
    status: "completed"
  }
]

// Vermont Jobs
[
  {
    id: "cs_test_3",
    serviceLocation: "vermont",
    serviceType: "basic",
    totalPrice: 120.00,
    preferredDate: "2024-12-26",
    status: "completed"
  }
]
```

### Calculated Metrics

**New Jersey:**
- Jobs: 2
- Revenue: $340.00
- Cost Estimate: $170.00 (120*0.5 + 220*0.55)
- Profit: $170.00
- Margin: 50.0%

**Vermont:**
- Jobs: 1
- Revenue: $120.00
- Cost Estimate: $60.00 (120*0.5)
- Profit: $60.00
- Margin: 50.0%

## Extending to More States

### Example: Adding New York

**1. Update Type:**
```typescript
export type ServiceRegion = 'new_jersey' | 'vermont' | 'new_york';
```

**2. Update Revenue Calculation:**
```typescript
const nyJobs = jobs.filter(job => job.serviceLocation === 'new_york');
return {
  new_jersey: { jobs: njJobs.length, revenue: ... },
  vermont: { jobs: vtJobs.length, revenue: ... },
  new_york: {
    jobs: nyJobs.length,
    revenue: nyJobs.reduce((sum, job) => sum + job.totalPrice, 0)
  }
};
```

**3. Update UI Components:**
```typescript
// In BranchComparison.tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <BranchSummaryCard branch="new_jersey" {...njData} />
  <BranchSummaryCard branch="vermont" {...vtData} />
  <BranchSummaryCard branch="new_york" {...nyData} />
</div>
```

**4. Add Badge Color:**
```typescript
const badgeColor = 
  branch === 'new_jersey' ? 'bg-blue-100 text-blue-800' :
  branch === 'vermont' ? 'bg-green-100 text-green-800' :
  'bg-purple-100 text-purple-800'; // New York
```

## Database Query Examples

### When Migrating to Database

```sql
-- Get branch revenue for month
SELECT 
  service_location,
  COUNT(*) as jobs,
  SUM(total_price) as revenue
FROM jobs
WHERE status = 'completed'
  AND preferred_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY service_location;

-- Get branch profitability
SELECT 
  service_location,
  COUNT(*) as jobs,
  SUM(total_price) as revenue,
  SUM(
    CASE service_type
      WHEN 'basic' THEN total_price * 0.5
      WHEN 'deep' THEN total_price * 0.55
      WHEN 'moveInOut' THEN total_price * 0.6
      ELSE total_price * 0.5
    END
  ) as cost_estimate,
  SUM(total_price) - SUM(
    CASE service_type
      WHEN 'basic' THEN total_price * 0.5
      WHEN 'deep' THEN total_price * 0.55
      WHEN 'moveInOut' THEN total_price * 0.6
      ELSE total_price * 0.5
    END
  ) as profit
FROM jobs
WHERE status = 'completed'
  AND preferred_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY service_location;
```



