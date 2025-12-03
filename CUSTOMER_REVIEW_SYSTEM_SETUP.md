# Customer Review & Rating System - Setup Guide

## Overview

The Customer Review & Rating System allows customers to rate their cleaning service, provide feedback, and request corrections. Ratings feed into Cleaner Scorecards, Branch Performance Dashboards, and can be used for future bonuses.

## Features

- **Review Submission**: Customers rate service (1-5 stars) and provide optional feedback
- **Re-clean Requests**: Customers can request follow-up cleaning
- **Auto-Request**: Review link sent via WhatsApp after job completion
- **Scorecard Integration**: Reviews appear in Cleaner Scorecard
- **Admin Dashboard**: Latest reviews displayed in Operations Dashboard
- **Low-Rating Alerts**: Automatic alerts for ratings ≤ 3

## Routes

### Frontend Pages

- `/review/[jobId]` - Public review submission page

### API Endpoints

- `POST /api/reviews/create` - Create new review
- `GET /api/reviews/list?cleanerId=xxx&region=xxx` - List reviews
- `GET /api/reviews/job/[jobId]` - Get job details for review page

## Database Model

### Reviews Table Schema

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL,
  cleaner_id VARCHAR(255) NOT NULL,
  service_location VARCHAR(20) NOT NULL 
    CHECK (service_location IN ('new_jersey', 'vermont')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  request_reclean BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id),
  CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
);

CREATE INDEX idx_reviews_cleaner ON reviews(cleaner_id);
CREATE INDEX idx_reviews_job ON reviews(job_id);
CREATE INDEX idx_reviews_location ON reviews(service_location);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at);
```

### Current Implementation

- Uses in-memory storage (mock data)
- Ready for database migration
- All functions have TODO comments for DB integration

## Review Flow

### 1. Job Completion

When cleaner marks job as "completed":
1. System sends WhatsApp review request to customer
2. Message includes review link: `https://velocitymaid.com/review/{jobId}`

### 2. Customer Review

1. Customer clicks link in WhatsApp
2. Lands on `/review/[jobId]` page
3. Sees job details (cleaner, date, service type)
4. Submits rating (1-5 stars)
5. Optionally adds comment
6. Optionally requests re-clean
7. Submits review

### 3. Review Processing

1. Review saved to database
2. If rating ≤ 3:
   - Alert sent to admin WhatsApp
   - Review tagged for follow-up
3. Review appears in:
   - Cleaner Scorecard
   - Admin Dashboard
   - Branch Performance metrics

## WhatsApp Templates

### Review Request Template

**Template Name:** `review_request_v1`

**Language:** `en_US`

**Body Text:**
```
Hi {{1}}, thank you for choosing VelocityMaid!

We hope you were satisfied with your cleaning service on {{2}}.

Please take a moment to rate your experience:
{{3}}

Your feedback helps us improve!
```

**Parameters:**
1. `customer_name` - Customer's name
2. `service_date` - Formatted service date
3. `review_link` - Full URL to review page

**Example:**
```
Hi John D, thank you for choosing VelocityMaid!

We hope you were satisfied with your cleaning service on December 26, 2024.

Please take a moment to rate your experience:
https://velocitymaid.com/review/cs_test_abc123

Your feedback helps us improve!
```

### Low-Rating Alert Template

**Template Name:** `admin_low_rating_v1`

**Language:** `en_US`

**Body Text:**
```
⚠️ Low Rating Alert [{{3}}]

Job ID: {{1}}
Rating: {{2}}/5
{{4}}
{{5}}

Please follow up with the customer.
```

**Parameters:**
1. `job_id` - Job ID (first 12 characters)
2. `rating` - Rating (1-5)
3. `location` - Service location (New Jersey/Vermont)
4. `comment` - Customer comment (or "No comment provided")
5. `reclean_request` - "Re-clean requested" or "No re-clean request"

**Example:**
```
⚠️ Low Rating Alert [New Jersey]

Job ID: cs_test_abc...
Rating: 2/5
The cleaner missed some areas in the kitchen.
Re-clean requested

Please follow up with the customer.
```

## Meta WhatsApp Template Setup

### Step 1: Create Review Request Template

1. Go to Meta Business Manager
2. Navigate to WhatsApp > Message Templates
3. Click "Create Template"
4. Fill in:
   - **Name:** `review_request_v1`
   - **Category:** Utility
   - **Language:** English (US)
   - **Body:** (Use template text above)
   - **Variables:** 3 (customer_name, service_date, review_link)
5. Submit for approval

### Step 2: Create Low-Rating Alert Template

1. Create new template
2. Fill in:
   - **Name:** `admin_low_rating_v1`
   - **Category:** Utility
   - **Language:** English (US)
   - **Body:** (Use template text above)
   - **Variables:** 5 (job_id, rating, location, comment, reclean_request)
3. Submit for approval

## Zapier Integration (Alternative)

If not using direct WhatsApp API:

### Review Request Webhook

**Trigger:** Job completed
**Action:** WhatsApp Cloud API

**Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "{{customer_phone}}",
  "type": "template",
  "template": {
    "name": "review_request_v1",
    "language": { "code": "en_US" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "{{customer_name}}" },
        { "type": "text", "text": "{{service_date}}" },
        { "type": "text", "text": "https://velocitymaid.com/review/{{job_id}}" }
      ]
    }]
  }
}
```

## Integration Points

### Cleaner Scorecard

- **Average Rating**: Calculated from all reviews
- **Total Reviews**: Count of reviews
- **Rating Trend**: Last 6 ratings chart
- **Re-clean Rate**: Percentage requesting re-clean
- **Warning Badge**: Shows if average < 4.0

### Admin Dashboard

- **Reviews Table**: Latest 20 reviews
- **Region Filter**: Filter by NJ/VT
- **Low-Rating Highlight**: Ratings ≤ 3 highlighted in red
- **Re-clean Indicator**: Shows if re-clean requested

### Job Completion Flow

- **Automatic Trigger**: When job status = "completed"
- **WhatsApp Message**: Sent to customer phone
- **Non-Blocking**: Doesn't fail if message fails
- **Link Generation**: Uses `NEXT_PUBLIC_BASE_URL` environment variable

## Environment Variables

Required:
```bash
WHATSAPP_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
ADMIN_WHATSAPP_NJ=+1973xxxxxxx
ADMIN_WHATSAPP_VT=+1802xxxxxxx
```

## Testing

### Test Review Submission

1. Complete a job (mark as "completed")
2. Check WhatsApp for review request message
3. Click review link
4. Submit review with rating and comment
5. Verify review appears in:
   - Cleaner Scorecard
   - Admin Dashboard

### Test Low-Rating Alert

1. Submit review with rating ≤ 3
2. Check admin WhatsApp for alert
3. Verify review is highlighted in dashboard

## Database Migration

### Current State

- Uses in-memory mock storage
- All functions ready for DB migration
- TODO comments mark migration points

### Migration Steps

1. **Create Reviews Table** (see schema above)
2. **Update `reviewData.ts`**:
   - Replace `MOCK_REVIEWS` with database queries
   - Update `createReview()` to use INSERT
   - Update `getReviewsByCleanerId()` to use SELECT
   - Add connection pooling

3. **Add Foreign Keys**:
   - Link to jobs table
   - Link to cleaners table

4. **Add Indexes**:
   - For performance on common queries
   - For filtering by rating, location, date

## Security

### Review Validation

- Rating must be 1-5
- Job ID must exist
- Cleaner ID must exist
- One review per job (prevents duplicates)

### Access Control

- Review page is public (no auth required)
- Review creation validates job exists
- Admin dashboard requires authentication (TODO)

## Future Enhancements

1. **Photo Uploads**: Allow customers to upload photos
2. **Review Moderation**: Admin approval before publishing
3. **Public Reviews**: Display on website
4. **Review Responses**: Cleaners can respond to reviews
5. **Review Analytics**: Detailed review insights
6. **Bonus Calculation**: Use ratings for cleaner bonuses



