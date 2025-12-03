# Dashboard Examples & Mock Data

## Example Dashboard Output

### API Response Structure

```json
{
  "success": true,
  "data": {
    "jobsToday": [
      {
        "sessionId": "cs_test_abc123",
        "customerName": "John D",
        "phone": "+19731234567",
        "email": "john@example.com",
        "serviceType": "basic",
        "preferredDate": "2024-12-26",
        "preferredTime": "10:00 AM",
        "address": "123 Main St, Newark, NJ 07102",
        "serviceLocation": "new_jersey",
        "totalPrice": 120,
        "status": "assigned",
        "assignedCleanerPhone": "+19735556677",
        "assignedCleanerName": "John Cleaner",
        "confirmationSent": true,
        "reminderSent": true,
        "createdAt": "2024-12-20T10:30:00Z"
      }
    ],
    "jobsNext7Days": [...],
    "revenueData": [
      {
        "date": "2024-12-20",
        "newJersey": 450,
        "vermont": 320,
        "total": 770
      },
      {
        "date": "2024-12-21",
        "newJersey": 680,
        "vermont": 240,
        "total": 920
      }
    ],
    "cleanerSchedules": [
      {
        "cleanerPhone": "+19735556677",
        "cleanerName": "John Cleaner",
        "jobs": [...],
        "gaps": [],
        "overlaps": []
      }
    ],
    "unassignedJobs": [...],
    "bookingFeed": [...],
    "reminderStatus": [...],
    "jobsMissingConfirmation": [...],
    "jobsWithInvalidPhone": [],
    "kpiStats": {
      "jobsToday": 5,
      "revenueToday": 650,
      "completionRate": 85.5,
      "cleanersActiveToday": 3,
      "pendingApproval": 0,
      "jobsMissingAssignment": 2
    }
  },
  "region": null,
  "timestamp": "2024-12-26T10:30:00Z"
}
```

## Mock Data for Testing

If you need to test without Stripe data, you can create a mock API response:

```typescript
// app/api/dashboard/data/route.ts (for testing)
const mockData = {
  jobsToday: [
    {
      sessionId: 'cs_test_1',
      customerName: 'John D',
      phone: '+19731234567',
      email: 'john@example.com',
      serviceType: 'Basic Clean',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '10:00 AM',
      address: '123 Main St, Newark, NJ',
      serviceLocation: 'new_jersey',
      totalPrice: 120,
      status: 'assigned',
      assignedCleanerPhone: '+19735556677',
      assignedCleanerName: 'John Cleaner',
      confirmationSent: true,
      reminderSent: true,
      createdAt: new Date().toISOString(),
    },
  ],
  // ... more mock data
};
```

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  VelocityMaid Operations Command Center                  │
│  Real-time operational visibility for NJ & VT            │
└─────────────────────────────────────────────────────────┘

[ New Jersey ] [ Vermont ] [ All ]

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Jobs     │ │ Revenue  │ │ Complete │ │ Cleaners │ │ Pending  │ │ Missing  │
│ Today: 5 │ │ $650     │ │ 85.5%   │ │ Active: 3│ │ Approval:│ │ Assign: 2│
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────┐ ┌──────────────────────────────┐
│  Upcoming Jobs (Next 7 Days)        │ │  Operations Alerts            │
│                                      │ │  ⚠️ 2 Jobs Needing Reminders  │
│  ┌──────────────────────────────┐   │ │  ⚠️ 1 Missing Confirmation     │
│  │ John D          [NJ] [Assigned]│ │ │  ⚠️ 2 Unassigned Jobs         │
│  │ 123 Main St                   │   │ │                               │
│  │ Dec 26 • 10:00 AM • $120     │   │ │  New Bookings (Last 24h)     │
│  │ Cleaner: John Cleaner         │   │ │  ┌────────────────────────┐ │
│  └──────────────────────────────┘   │ │  │ Jane S [VT] 2h ago      │ │
│                                      │ │  │ Basic Clean • $120      │ │
│  ┌──────────────────────────────┐   │ │  └────────────────────────┘ │
│  │ Jane S          [VT] [Confirmed]│ │ │                               │
│  │ 456 Oak Ave                    │   │ │                               │
│  │ Dec 27 • 2:00 PM • $180        │   │ │                               │
│  └──────────────────────────────┘   │ │                               │
└─────────────────────────────────────┘ └──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Revenue (Last 7 Days)                                  │
│  Dec 20: ████████████ $770 (NJ: $450, VT: $320)        │
│  Dec 21: ████████████████ $920 (NJ: $680, VT: $240)    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Cleaner Schedules                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ John Cleaner  │  │ Jane Cleaner │  │ Bob Cleaner  │ │
│  │ +19735556677  │  │ +18025556677 │  │ +19734445555 │ │
│  │ [NJ]          │  │ [VT]         │  │ [NJ]         │ │
│  │ 3 jobs        │  │ 2 jobs       │  │ 1 job        │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Testing Scenarios

### 1. Filter by New Jersey
- Click "New Jersey" tab
- Only NJ jobs should display
- Revenue chart shows only NJ data
- Cleaner schedules show only NJ cleaners

### 2. Filter by Vermont
- Click "Vermont" tab
- Only VT jobs should display
- Revenue chart shows only VT data
- Cleaner schedules show only VT cleaners

### 3. View All Regions
- Click "All" tab
- All jobs from both regions display
- Revenue chart shows both NJ and VT
- All cleaner schedules visible

### 4. Real-time Updates
- Dashboard auto-refreshes every 10 seconds
- New bookings appear in feed
- KPI metrics update
- Job status changes reflect immediately

## Status Indicators

- **Scheduled**: Gray badge - Job created but not confirmed
- **Confirmed**: Blue badge - Payment received, confirmed
- **Assigned**: Yellow badge - Cleaner assigned
- **Completed**: Green badge - Job completed
- **Cancelled**: Red badge - Job cancelled

## Location Badges

- **New Jersey**: Blue badge
- **Vermont**: Green badge

## Alert Types

1. **Jobs Needing 24h Reminders**: Yellow alert
   - Jobs within 24 hours without reminder sent

2. **Jobs Missing WhatsApp Confirmation**: Orange alert
   - Jobs without confirmation sent

3. **Jobs with Invalid Phone Numbers**: Red alert
   - Jobs with missing or invalid phone numbers

4. **Unassigned Jobs**: Blue alert
   - Jobs without cleaner assignment



