# Smart Complaint Resolution System - Setup Guide

## Overview

The Smart Complaint Resolution System automatically creates complaint cases when customers leave low ratings (≤3) or request re-cleans. It provides a complete workflow for tracking, managing, and resolving customer complaints.

## Features

- **Auto-Creation**: Complaints created automatically from low ratings or re-clean requests
- **Status Workflow**: pending → in_progress → resolved → closed
- **Resolution Tracking**: Multiple resolution types (re-clean, refund, credit, etc.)
- **Admin Dashboard**: Complete complaint management interface
- **Alerts**: Automatic notifications to admins when complaints are created
- **Integration**: Links to jobs, reviews, and cleaner scorecards

## Routes

### Frontend Pages

- `/dashboard/complaints` - Admin complaints dashboard (admin-only)

### API Endpoints

- `POST /api/complaints/create` - Create complaint (internal use)
- `PATCH /api/complaints/update` - Update complaint status/notes
- `GET /api/complaints/list` - List complaints with filters
- `PATCH /api/complaints/resolveViaReclean` - Resolve via re-clean

## Complaint Creation Logic

### Automatic Creation

When a review is created via `/api/reviews/create`:

**If rating ≤ 3 OR requestReclean === true:**
- Complaint automatically created
- Linked to review and job
- Status set to "pending"
- Alert sent to admin

### Manual Creation

Admins can also create complaints manually via:
```bash
POST /api/complaints/create
{
  "jobId": "cs_test_abc123",
  "reviewId": "review_123",
  "cleanerId": "cleaner_1",
  "serviceLocation": "new_jersey",
  "customerName": "John D",
  "customerPhone": "+19731234567",
  "rating": 2,
  "comment": "Poor service",
  "requestReclean": true
}
```

## Status Workflow

```
pending → in_progress → resolved → closed
```

### Status Definitions

- **pending**: Complaint created, awaiting admin review
- **in_progress**: Admin is working on resolution
- **resolved**: Complaint resolved, solution implemented
- **closed**: Complaint closed, no further action needed

## Resolution Types

- **reclean**: Re-cleaning scheduled/completed
- **refund_partial**: Partial refund issued
- **refund_full**: Full refund issued
- **credit**: Credit applied to account
- **no_issue**: No issue found, complaint dismissed

## Database Model

### Complaints Table Schema

```sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL,
  review_id VARCHAR(255),
  cleaner_id VARCHAR(255),
  service_location VARCHAR(20) NOT NULL 
    CHECK (service_location IN ('new_jersey', 'vermont')),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  request_reclean BOOLEAN DEFAULT false,
  status VARCHAR(20) NOT NULL 
    CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  resolution_type VARCHAR(20) 
    CHECK (resolution_type IN ('reclean', 'refund_partial', 'refund_full', 'credit', 'no_issue')),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id),
  CONSTRAINT fk_review FOREIGN KEY (review_id) REFERENCES reviews(id),
  CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
);
```

## Alert System

### WhatsApp Alert

When a complaint is created, system sends WhatsApp to correct admin:

**Template Name:** `admin_complaint_v1` (TODO: Create in Meta)

**Message Format:**
```
🚨 New Complaint Created [New Jersey]

Customer: John D
Rating: ⭐⭐☆☆☆ (2/5)
Job ID: cs_test_abc...
Comment: Poor service quality
🔄 Re-clean requested

Please review and take action.
```

### Email Alert

**Subject:** `New VelocityMaid Complaint — [NJ/VT]`

**Body:** Includes all complaint details

**TODO:** Implement email sending (SendGrid, Resend, etc.)

## Integration Points

### Review Creation

- **Location:** `/app/api/reviews/create/route.ts`
- **Trigger:** When rating ≤ 3 OR requestReclean = true
- **Action:** Auto-creates complaint and sends alert

### Cleaner Scorecard

- **Location:** `/app/cleaners/scorecard/page.tsx`
- **Updates:**
  - Complaint count
  - Complaint rate (% of jobs with complaints)
  - Latest complaint ratings
  - Service Recovery section

### Admin Dashboard

- **Location:** `/app/dashboard/complaints/page.tsx`
- **Features:**
  - Filter by status and region
  - View all complaint details
  - Update status and resolution
  - Add admin notes

## Testing

### Test Complaint Creation

1. Submit review with rating ≤ 3:
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

2. Verify complaint created automatically
3. Check admin WhatsApp for alert
4. View complaint in dashboard

### Test Resolution Workflow

1. Navigate to `/dashboard/complaints`
2. Click "View / Update" on a complaint
3. Update status to "in_progress"
4. Add resolution type
5. Add admin notes
6. Mark as "resolved"
7. Verify resolvedAt timestamp set

## Database Migration

### Current Implementation

- Uses in-memory mock storage
- All functions ready for DB migration
- TODO comments mark migration points

### Migration Steps

1. **Create Complaints Table** (see schema above)
2. **Update `complaintData.ts`**:
   - Replace mock storage with database queries
   - Add connection pooling
   - Implement transactions

3. **Add Foreign Keys**:
   - Link to jobs table
   - Link to reviews table
   - Link to cleaners table

4. **Add Indexes**:
   ```sql
   CREATE INDEX idx_complaints_status ON complaints(status);
   CREATE INDEX idx_complaints_location ON complaints(service_location);
   CREATE INDEX idx_complaints_cleaner ON complaints(cleaner_id);
   CREATE INDEX idx_complaints_created ON complaints(created_at);
   ```

## WhatsApp Template Setup

### Create Complaint Alert Template

1. Go to Meta Business Manager
2. WhatsApp > Message Templates > Create Template
3. **Name:** `admin_complaint_v1`
4. **Category:** Utility
5. **Language:** English (US)
6. **Body:**
   ```
   🚨 New Complaint Created [{{3}}]

   Customer: {{1}}
   Rating: {{2}}/5
   Job ID: {{4}}
   {{5}}
   {{6}}

   Please review and take action.
   ```
7. **Parameters:**
   1. Customer name
   2. Rating (1-5)
   3. Location (New Jersey/Vermont)
   4. Job ID (first 12 chars)
   5. Re-clean requested (Yes/No)
   6. Comment (or "No comment provided")
8. Submit for approval

## Zapier Integration (Alternative)

If using Zapier for alerts:

### Complaint Alert Webhook

**Trigger:** Complaint created
**Action:** WhatsApp Cloud API

**Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "{{admin_phone}}",
  "type": "template",
  "template": {
    "name": "admin_complaint_v1",
    "language": { "code": "en_US" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "{{customer_name}}" },
        { "type": "text", "text": "{{rating}}" },
        { "type": "text", "text": "{{location}}" },
        { "type": "text", "text": "{{job_id}}" },
        { "type": "text", "text": "{{reclean_request}}" },
        { "type": "text", "text": "{{comment}}" }
      ]
    }]
  }
}
```

## Access Control

**Current Status:** TODO - Admin authentication not yet implemented

**To Implement:**
1. Create admin authentication check
2. Add to `/app/dashboard/complaints/page.tsx`
3. Add to all complaint API routes
4. Redirect unauthorized users

## Future Enhancements

1. **Automated Resolution**
   - Auto-schedule re-cleans
   - Auto-issue refunds for certain cases
   - Escalation rules

2. **Customer Communication**
   - Send updates to customer
   - Allow customer to track complaint status
   - Two-way communication

3. **Analytics**
   - Complaint trends
   - Resolution time analysis
   - Common complaint types
   - Cleaner complaint patterns

4. **Integration with Payment Systems**
   - Automatic refund processing
   - Credit application
   - Payment tracking



