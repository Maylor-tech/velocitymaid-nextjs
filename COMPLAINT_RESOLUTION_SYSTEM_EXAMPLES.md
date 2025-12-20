# Complaint Resolution System - Examples & Workflows

## Example Complaint Data

### Complaint Object

```typescript
{
  id: "complaint_1703616000000_abc123",
  jobId: "cs_test_abc123",
  reviewId: "review_1703616000000_abc123",
  cleanerId: "cleaner_1",
  serviceLocation: "new_jersey",
  customerName: "John D",
  customerPhone: "+19731234567",
  rating: 2,
  comment: "The cleaner missed several areas in the kitchen and bathroom.",
  requestReclean: true,
  status: "pending",
  resolutionType: null,
  adminNotes: null,
  createdAt: "2024-12-26T10:30:00Z",
  updatedAt: "2024-12-26T10:30:00Z",
  resolvedAt: null
}
```

### Resolved Complaint

```typescript
{
  id: "complaint_1703616000000_def456",
  jobId: "cs_test_def456",
  reviewId: "review_1703616000000_def456",
  cleanerId: "cleaner_1",
  serviceLocation: "new_jersey",
  customerName: "Jane S",
  customerPhone: "+19739876543",
  rating: 3,
  comment: "Service was okay but could be better.",
  requestReclean: false,
  status: "resolved",
  resolutionType: "reclean",
  adminNotes: "Scheduled re-clean for Dec 28, 2024. New job ID: cs_test_new123",
  createdAt: "2024-12-26T09:00:00Z",
  updatedAt: "2024-12-26T14:30:00Z",
  resolvedAt: "2024-12-26T14:30:00Z"
}
```

## API Request/Response Examples

### Auto-Create Complaint (via Review)

```bash
POST /api/reviews/create
{
  "jobId": "cs_test_abc123",
  "cleanerId": "cleaner_1",
  "rating": 2,
  "comment": "Poor service",
  "requestReclean": true,
  "serviceLocation": "new_jersey"
}
```

**Response:**
```json
{
  "success": true,
  "reviewId": "review_1703616000000_abc123",
  "review": { ... },
  "complaintId": "complaint_1703616000000_abc123"
}
```

### Update Complaint Status

```bash
PATCH /api/complaints/update
{
  "complaintId": "complaint_1703616000000_abc123",
  "status": "in_progress",
  "adminNotes": "Contacted customer. Scheduled re-clean for tomorrow."
}
```

**Response:**
```json
{
  "success": true,
  "complaint": {
    "id": "complaint_1703616000000_abc123",
    "status": "in_progress",
    "adminNotes": "Contacted customer. Scheduled re-clean for tomorrow.",
    "updatedAt": "2024-12-26T11:00:00Z",
    ...
  }
}
```

### Resolve via Re-clean

```bash
PATCH /api/complaints/resolveViaReclean
{
  "complaintId": "complaint_1703616000000_abc123",
  "newJobId": "cs_test_new123",
  "resolutionNotes": "Re-clean completed successfully. Customer satisfied."
}
```

**Response:**
```json
{
  "success": true,
  "complaint": {
    "id": "complaint_1703616000000_abc123",
    "status": "resolved",
    "resolutionType": "reclean",
    "resolvedAt": "2024-12-26T14:30:00Z",
    "adminNotes": "Resolved via re-clean (New Job ID: cs_test_new123)\n\nRe-clean completed successfully. Customer satisfied.",
    ...
  }
}
```

### List Complaints

```bash
GET /api/complaints/list?status=pending&location=new_jersey
```

**Response:**
```json
{
  "success": true,
  "complaints": [
    {
      "id": "complaint_1703616000000_abc123",
      "jobId": "cs_test_abc123",
      "status": "pending",
      ...
    }
  ],
  "stats": {
    "openComplaints": 5,
    "openByRegion": {
      "new_jersey": 3,
      "vermont": 2
    },
    "avgRatingOnComplaints": 2.4,
    "recleanRequestRate": 60.0,
    "avgResolutionTime": 24.5
  },
  "count": 5
}
```

## Resolution Workflow Example

### Step 1: Complaint Created

**Trigger:** Customer submits review with rating 2/5

**Auto-Actions:**
- Complaint created with status "pending"
- Alert sent to admin WhatsApp
- Email alert sent (if configured)

**Complaint State:**
```json
{
  "status": "pending",
  "resolutionType": null,
  "adminNotes": null,
  "resolvedAt": null
}
```

### Step 2: Admin Reviews

**Action:** Admin opens complaint in dashboard

**Complaint State:**
- Still "pending"
- Admin reviewing details

### Step 3: Admin Takes Action

**Action:** Admin updates status to "in_progress"

**Update:**
```json
{
  "status": "in_progress",
  "adminNotes": "Contacted customer via phone. Customer confirmed issues. Scheduling re-clean."
}
```

### Step 4: Re-clean Scheduled

**Action:** Admin schedules re-clean job

**Update:**
```json
{
  "status": "in_progress",
  "resolutionType": "reclean",
  "adminNotes": "Re-clean scheduled for Dec 28, 2024. Assigned cleaner_2."
}
```

### Step 5: Re-clean Completed

**Action:** Admin marks re-clean as completed

**Update via `/api/complaints/resolveViaReclean`:**
```json
{
  "status": "resolved",
  "resolutionType": "reclean",
  "resolvedAt": "2024-12-28T16:00:00Z",
  "adminNotes": "Resolved via re-clean (New Job ID: cs_test_new123)\n\nRe-clean completed. Customer confirmed satisfaction."
}
```

### Step 6: Complaint Closed

**Action:** Admin closes complaint after verification

**Update:**
```json
{
  "status": "closed",
  "resolvedAt": "2024-12-28T16:00:00Z"
}
```

## WhatsApp Alert Payload

### Complaint Alert Template

**Template Name:** `admin_complaint_v1`

**Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "+19739876543",
  "type": "template",
  "template": {
    "name": "admin_complaint_v1",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "John D"
          },
          {
            "type": "text",
            "text": "2"
          },
          {
            "type": "text",
            "text": "New Jersey"
          },
          {
            "type": "text",
            "text": "cs_test_abc..."
          },
          {
            "type": "text",
            "text": "Yes"
          },
          {
            "type": "text",
            "text": "The cleaner missed several areas in the kitchen."
          }
        ]
      }
    ]
  }
}
```

## UI Preview

### Complaints Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Customer Complaints & Service Recovery — VelocityMaid  │
│  Manage and resolve customer complaints                  │
└─────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Open     │ │ Open (NJ)│ │ Open (VT)│ │ Avg      │ │ Re-clean │
│ Complaints│ │          │ │          │ │ Rating   │ │ Rate     │
│ 5        │ │ 3        │ │ 2        │ │ 2.4      │ │ 60.0%    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────────┐
│  Filters                                                │
│  Status: [All] [Pending] [In Progress] [Resolved] [Closed]│
│  Region: [All] [New Jersey] [Vermont]                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Active Complaints                                      │
├─────────────────────────────────────────────────────────┤
│  Created  Job ID      Customer  Rating  Status  Action │
│  Dec 26   cs_test...  John D   ★★☆☆☆  Pending  [View] │
│  Dec 25   cs_test...  Jane S   ★★★☆☆  In Prog  [View] │
└─────────────────────────────────────────────────────────┘
```

### Complaint Detail Modal

```
┌─────────────────────────────────────────────────────────┐
│  Complaint Details                              [×]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Complaint ID: complaint_1703616000000_abc123          │
│  Status: Pending                                         │
│  Job ID: cs_test_abc123                                  │
│  Location: [New Jersey]                                  │
│                                                         │
│  Customer Information                                    │
│  Name: John D                                            │
│  Phone: +19731234567                                     │
│                                                         │
│  Review Information                                      │
│  Rating: ★★☆☆☆ (2/5)                                    │
│  Comment: The cleaner missed several areas...            │
│  Re-clean Requested: [Yes]                              │
│                                                         │
│  Timeline                                                │
│  Complaint Created: Dec 26, 2024 10:30 AM               │
│  Last Updated: Dec 26, 2024 10:30 AM                    │
│                                                         │
│  Update Complaint                                        │
│  Status: [Pending ▼]                                    │
│  Resolution Type: [— Select — ▼]                       │
│  Admin Notes:                                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [Save Changes] [Cancel]                                │
└─────────────────────────────────────────────────────────┘
```

## Scorecard Integration Example

### Service Recovery Section

```
┌─────────────────────────────────────────────────────────┐
│  Service Recovery                              [3 Complaints]│
├─────────────────────────────────────────────────────────┤
│  Complaint Rate: 6.0%                                  │
│  Jobs with Complaints: 3 out of 50 total               │
│  Latest Complaint Ratings: 🔴 🔴 🟡                    │
└─────────────────────────────────────────────────────────┘
```

### Review with Complaint Badge

```
┌─────────────────────────────────────────────────────────┐
│  Recent Reviews                                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ★★☆☆☆ [NJ] [Complaint Open] Dec 26, 2024        │ │
│  │ "Poor service quality"                            │ │
│  │ [Re-clean Requested]                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ★★★☆☆ [NJ] [Complaint Resolved] Dec 25, 2024    │ │
│  │ "Service was okay"                                │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Mock Data Examples

### Example Complaints

```typescript
// Pending Complaint
{
  id: "complaint_1",
  jobId: "cs_test_abc123",
  reviewId: "review_1",
  cleanerId: "cleaner_1",
  serviceLocation: "new_jersey",
  customerName: "John D",
  customerPhone: "+19731234567",
  rating: 2,
  comment: "Kitchen not cleaned properly",
  requestReclean: true,
  status: "pending",
  resolutionType: null,
  adminNotes: null,
  createdAt: "2024-12-26T10:00:00Z",
  updatedAt: "2024-12-26T10:00:00Z",
  resolvedAt: null
}

// Resolved Complaint
{
  id: "complaint_2",
  jobId: "cs_test_def456",
  reviewId: "review_2",
  cleanerId: "cleaner_1",
  serviceLocation: "new_jersey",
  customerName: "Jane S",
  customerPhone: "+19739876543",
  rating: 3,
  comment: "Could be better",
  requestReclean: false,
  status: "resolved",
  resolutionType: "reclean",
  adminNotes: "Resolved via re-clean (New Job ID: cs_test_new123)\n\nCustomer satisfied.",
  createdAt: "2024-12-25T09:00:00Z",
  updatedAt: "2024-12-26T14:00:00Z",
  resolvedAt: "2024-12-26T14:00:00Z"
}
```

## Database Query Examples

### When Migrating to Database

```sql
-- Create complaint
INSERT INTO complaints (
  job_id, review_id, cleaner_id, service_location,
  customer_name, customer_phone, rating, comment,
  request_reclean, status
) VALUES (
  'cs_test_abc123',
  'review_1',
  'cleaner_1',
  'new_jersey',
  'John D',
  '+19731234567',
  2,
  'Kitchen not cleaned properly',
  true,
  'pending'
);

-- Get open complaints
SELECT * FROM complaints
WHERE status IN ('pending', 'in_progress')
ORDER BY created_at DESC;

-- Update complaint status
UPDATE complaints
SET 
  status = 'resolved',
  resolution_type = 'reclean',
  admin_notes = 'Re-clean completed',
  resolved_at = NOW(),
  updated_at = NOW()
WHERE id = 'complaint_123';

-- Get complaints by cleaner
SELECT * FROM complaints
WHERE cleaner_id = 'cleaner_1'
ORDER BY created_at DESC;

-- Calculate complaint statistics
SELECT 
  COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')) as open_complaints,
  AVG(rating) as avg_rating,
  COUNT(*) FILTER (WHERE request_reclean = true) * 100.0 / COUNT(*) as reclean_rate
FROM complaints;
```




