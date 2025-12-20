# Cleaner Incentive Engine - Examples & Outputs

## Example Incentive Data

### Incentive Object

```typescript
{
  id: "incentive_1703616000000_abc123",
  cleanerId: "cleaner_1",
  periodStart: "2024-12-22",
  periodEnd: "2024-12-28",
  totalJobs: 12,
  onTimeRate: 91.7,
  completionRate: 100.0,
  avgRating: 4.6,
  complaintRate: 8.3,
  bonusAmount: 60.00,
  tier: "Gold",
  createdAt: "2024-12-29T00:00:00Z",
  updatedAt: "2024-12-29T00:00:00Z"
}
```

### Platinum Tier Example

```typescript
{
  id: "incentive_1703616000000_def456",
  cleanerId: "cleaner_2",
  periodStart: "2024-12-22",
  periodEnd: "2024-12-28",
  totalJobs: 18,
  onTimeRate: 94.4,
  completionRate: 100.0,
  avgRating: 4.9,
  complaintRate: 2.8,
  bonusAmount: 126.00,
  tier: "Platinum",
  createdAt: "2024-12-29T00:00:00Z",
  updatedAt: "2024-12-29T00:00:00Z"
}
```

## Tier Calculation Examples

### Example 1: Gold Tier

```typescript
const metrics = {
  totalJobs: 12,
  avgRating: 4.6,
  onTimeRate: 88,
  complaintRate: 8,
};

const tier = calculateTier(metrics); // "Gold"
const bonus = calculateBonus(tier, metrics.totalJobs); // 60.00
```

### Example 2: Silver Tier

```typescript
const metrics = {
  totalJobs: 8,
  avgRating: 4.3,
  onTimeRate: 82,
  complaintRate: 12,
};

const tier = calculateTier(metrics); // "Silver"
const bonus = calculateBonus(tier, metrics.totalJobs); // 24.00
```

### Example 3: Bronze Tier

```typescript
const metrics = {
  totalJobs: 5,
  avgRating: 4.0,
  onTimeRate: 75,
  complaintRate: 20,
};

const tier = calculateTier(metrics); // "Bronze"
const bonus = calculateBonus(tier, metrics.totalJobs); // 7.50
```

## Next Tier Requirements Example

### Current: Silver, Target: Gold

```typescript
const currentMetrics = {
  totalJobs: 8,
  avgRating: 4.3,
  onTimeRate: 82,
  complaintRate: 12,
};

const currentTier = "Silver";

const requirements = calculateNextTierRequirements(currentMetrics, currentTier);
// {
//   nextTier: "Gold",
//   requirements: {
//     jobsNeeded: 2,
//     ratingNeeded: 0.2,
//     onTimeNeeded: 3,
//     complaintReduction: 2
//   }
// }
```

**Display:**
```
Next Tier: Gold
• 2 more jobs needed
• 0.2 higher average rating needed
• 3% higher on-time rate needed
• 2% lower complaint rate needed
```

## API Request/Response Examples

### List Incentives

```bash
GET /api/incentives/list?cleanerId=cleaner_1
```

**Response:**
```json
{
  "success": true,
  "incentives": [
    {
      "id": "incentive_1703616000000_abc123",
      "cleanerId": "cleaner_1",
      "periodStart": "2024-12-22",
      "periodEnd": "2024-12-28",
      "totalJobs": 12,
      "onTimeRate": 91.7,
      "completionRate": 100.0,
      "avgRating": 4.6,
      "complaintRate": 8.3,
      "bonusAmount": 60.00,
      "tier": "Gold",
      "createdAt": "2024-12-29T00:00:00Z",
      "updatedAt": "2024-12-29T00:00:00Z"
    }
  ],
  "count": 1
}
```

### Run Weekly Report

```bash
POST /api/incentives/run-report
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalProcessed": 10,
    "totalBonus": 450.00,
    "bonusByRegion": {
      "new_jersey": 280.00,
      "vermont": 170.00
    },
    "topPerformers": [
      {
        "cleanerId": "cleaner_2",
        "cleanerName": "Jane Cleaner",
        "tier": "Platinum",
        "bonusAmount": 126.00
      },
      {
        "cleanerId": "cleaner_1",
        "cleanerName": "John Cleaner",
        "tier": "Gold",
        "bonusAmount": 60.00
      },
      {
        "cleanerId": "cleaner_3",
        "cleanerName": "Bob Cleaner",
        "tier": "Silver",
        "bonusAmount": 24.00
      }
    ],
    "results": [...]
  },
  "message": "Weekly incentive report completed successfully"
}
```

## WhatsApp Payload Example

### Weekly Incentive Summary

**Template Name:** `weekly_incentive_summary_v1`

**Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "+19731234567",
  "type": "template",
  "template": {
    "name": "weekly_incentive_summary_v1",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "John Cleaner"
          },
          {
            "type": "text",
            "text": "Gold"
          },
          {
            "type": "text",
            "text": "12"
          },
          {
            "type": "text",
            "text": "$60.00"
          }
        ]
      }
    ]
  }
}
```

**Message Preview:**
```
🎉 Weekly Performance Summary

Hi John Cleaner!

Your performance tier this week: Gold
Jobs completed: 12
Bonus earned: $60.00

Keep up the great work!
```

## UI Preview

### Cleaner Incentives Page

```
┌─────────────────────────────────────────────────────────┐
│  My Incentives                                         │
│  Performance bonuses and tier tracking                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Current Tier: [🥇 Gold]    This Week's Bonus: $60.00 │
│                                                         │
│  Jobs Completed: 12  Avg Rating: 4.6/5                │
│  On-Time Rate: 91.7%  Complaint Rate: 8.3%            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Next Tier: Platinum                                    │
│  • 3 more jobs needed                                   │
│  • 0.2 higher average rating needed                     │
│  • 1.3% higher on-time rate needed                      │
│  • 3.3% lower complaint rate needed                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Last 8 Weeks Trend                                      │
│                                                         │
│  [🥇 Gold] Dec 22-28    $60.00                         │
│  [🥇 Gold] Dec 15-21    $55.00                         │
│  [🥈 Silver] Dec 8-14   $24.00                        │
└─────────────────────────────────────────────────────────┘
```

### Admin Incentive Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Cleaner Incentive Engine — VelocityMaid               │
│  Performance-based bonuses and tier tracking            │
└─────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Total    │ │ NJ Bonus │ │ VT Bonus │ │ Top      │ │ Top 3    │
│ Bonus    │ │          │ │          │ │ Performer│ │ Avg      │
│ $450.00  │ │ $280.00  │ │ $170.00  │ │ Jane C   │ │ $70.00   │
│          │ │          │ │          │ │ Platinum │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────────┐
│  Cleaner Tier Leaderboard                               │
├─────────────────────────────────────────────────────────┤
│  Rank  Cleaner    Branch  Tier    Jobs  Rating  Bonus  │
│  #1    cleaner_2  [NJ]   [💎]    18    4.9    $126.00│
│  #2    cleaner_1  [NJ]   [🥇]    12    4.6    $60.00 │
│  #3    cleaner_3  [VT]   [🥈]    8     4.3    $24.00 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Average Tier per Branch (Last 8 Weeks)                │
│                                                         │
│  Week 1:  NJ: ████████████ 3.2  VT: ████████ 2.5      │
│  Week 2:  NJ: ████████████ 3.3  VT: ████████ 2.6      │
│  Week 3:  NJ: ████████████ 3.4  VT: ████████ 2.7      │
└─────────────────────────────────────────────────────────┘
```

### Scorecard Integration

```
┌─────────────────────────────────────────────────────────┐
│  Current Tier: [🥇 Gold]    This Week's Bonus: $60.00│
│                                                         │
│  Next Tier: Platinum                                    │
│  • 3 more jobs needed                                   │
│  • 0.2 higher rating needed                             │
│  • 1.3% higher on-time rate needed                      │
└─────────────────────────────────────────────────────────┘
```

## Database Query Examples

### When Migrating to Database

```sql
-- Create incentive
INSERT INTO cleaner_incentives (
  cleaner_id, period_start, period_end,
  total_jobs, on_time_rate, completion_rate,
  avg_rating, complaint_rate, bonus_amount, tier
) VALUES (
  'cleaner_1',
  '2024-12-22',
  '2024-12-28',
  12,
  91.7,
  100.0,
  4.6,
  8.3,
  60.00,
  'Gold'
);

-- Get latest incentive for cleaner
SELECT * FROM cleaner_incentives
WHERE cleaner_id = 'cleaner_1'
ORDER BY period_start DESC
LIMIT 1;

-- Get all incentives for period
SELECT * FROM cleaner_incentives
WHERE period_start = '2024-12-22'
  AND period_end = '2024-12-28';

-- Calculate total bonus by region
SELECT 
  CASE 
    WHEN cleaner_id LIKE '%nj%' THEN 'new_jersey'
    ELSE 'vermont'
  END as region,
  SUM(bonus_amount) as total_bonus
FROM cleaner_incentives
WHERE period_start = '2024-12-22'
GROUP BY region;
```




