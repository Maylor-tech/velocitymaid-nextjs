# Customer Review System - Examples & Payloads

## Example Review Data

### Review Object

```typescript
{
  id: "review_1703616000000_abc123",
  jobId: "cs_test_abc123",
  cleanerId: "cleaner_1",
  serviceLocation: "new_jersey",
  rating: 5,
  comment: "Excellent service! The cleaner was thorough and professional.",
  requestReclean: false,
  createdAt: "2024-12-26T10:30:00Z",
  updatedAt: "2024-12-26T10:30:00Z"
}
```

### Low-Rating Review

```typescript
{
  id: "review_1703616000000_def456",
  jobId: "cs_test_def456",
  cleanerId: "cleaner_1",
  serviceLocation: "new_jersey",
  rating: 2,
  comment: "The cleaner missed several areas. Kitchen wasn't cleaned properly.",
  requestReclean: true,
  createdAt: "2024-12-26T11:00:00Z",
  updatedAt: "2024-12-26T11:00:00Z"
}
```

## API Request/Response Examples

### Create Review Request

```bash
POST /api/reviews/create
Content-Type: application/json

{
  "jobId": "cs_test_abc123",
  "cleanerId": "cleaner_1",
  "rating": 5,
  "comment": "Great service!",
  "requestReclean": false,
  "serviceLocation": "new_jersey"
}
```

### Create Review Response (Success)

```json
{
  "success": true,
  "reviewId": "review_1703616000000_abc123",
  "review": {
    "id": "review_1703616000000_abc123",
    "jobId": "cs_test_abc123",
    "cleanerId": "cleaner_1",
    "serviceLocation": "new_jersey",
    "rating": 5,
    "comment": "Great service!",
    "requestReclean": false,
    "createdAt": "2024-12-26T10:30:00Z",
    "updatedAt": "2024-12-26T10:30:00Z"
  }
}
```

### Create Review Response (Error - Invalid Rating)

```json
{
  "success": false,
  "error": "rating must be an integer between 1 and 5"
}
```

### Create Review Response (Error - Duplicate)

```json
{
  "success": false,
  "error": "Review already exists for this job"
}
```

### List Reviews Request

```bash
GET /api/reviews/list?cleanerId=cleaner_1
```

### List Reviews Response

```json
{
  "success": true,
  "reviews": [
    {
      "id": "review_1703616000000_abc123",
      "jobId": "cs_test_abc123",
      "cleanerId": "cleaner_1",
      "serviceLocation": "new_jersey",
      "rating": 5,
      "comment": "Great service!",
      "requestReclean": false,
      "createdAt": "2024-12-26T10:30:00Z",
      "updatedAt": "2024-12-26T10:30:00Z"
    }
  ],
  "stats": {
    "averageRating": 4.5,
    "totalReviews": 10,
    "last5Reviews": [...],
    "recleanRequestRate": 10.0,
    "ratingTrend": [5, 4, 5, 3, 5, 4]
  },
  "count": 10
}
```

## WhatsApp Payload Examples

### Review Request WhatsApp Payload

```json
{
  "messaging_product": "whatsapp",
  "to": "+19731234567",
  "type": "template",
  "template": {
    "name": "review_request_v1",
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
            "text": "December 26, 2024"
          },
          {
            "type": "text",
            "text": "https://velocitymaid.com/review/cs_test_abc123"
          }
        ]
      }
    ]
  }
}
```

### Low-Rating Alert WhatsApp Payload

```json
{
  "messaging_product": "whatsapp",
  "to": "+19739876543",
  "type": "template",
  "template": {
    "name": "admin_low_rating_v1",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "cs_test_abc..."
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
            "text": "The cleaner missed several areas in the kitchen."
          },
          {
            "type": "text",
            "text": "Re-clean requested"
          }
        ]
      }
    ]
  }
}
```

## Review Page UI Preview

```
┌─────────────────────────────────────────────────────────┐
│              Rate Your Service                          │
│        Help us improve by sharing your experience       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Service Details                                        │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Cleaner: John Cleaner                            │ │
│  │ Service Date: Wednesday, December 26, 2024       │ │
│  │ Service Type: Basic Clean                        │ │
│  │ Location: [New Jersey]                           │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  How would you rate your cleaning service? *           │
│                                                         │
│  ★ ★ ★ ★ ★                                            │
│  Excellent!                                             │
│                                                         │
│  Additional Comments (Optional)                        │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │ Tell us about your experience...                 │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ☐ Request a follow-up cleaning                        │
│    Check this if you'd like us to send someone back    │
│                                                         │
│  [        Submit Review        ]                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Scorecard Integration Example

### Updated Scorecard Display

```
┌─────────────────────────────────────────────────────────┐
│  Customer Rating                                        │
│                                                         │
│  ★★★★★ 4.5/5                                           │
│  Based on 10 reviews                                    │
│                                                         │
│  Rating Trend (Last 6 Jobs)                            │
│  Job 6: ████████████████████ 5.0/5                     │
│  Job 5: ████████████████ 4.0/5                         │
│  Job 4: ████████████████████ 5.0/5                     │
│  Job 3: ████████████ 3.0/5                             │
│  Job 2: ████████████████████ 5.0/5                     │
│  Job 1: ████████████████ 4.0/5                         │
│                                                         │
│  Recent Reviews                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ★★★★★ [NJ] Dec 26, 2024                         │ │
│  │ "Excellent service! Very thorough."              │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ★★★☆☆ [NJ] Dec 25, 2024 [Re-clean Requested]   │ │
│  │ "Missed some areas in the kitchen."               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Admin Dashboard Reviews Table

```
┌─────────────────────────────────────────────────────────┐
│  Customer Reviews — Latest 20                          │
├─────────────────────────────────────────────────────────┤
│  Job ID      Cleaner  Rating  Comment      Region  Date │
│  cs_test...  cleaner1 ★★★★★  "Great!"    [NJ]   Dec 26│
│  cs_test...  cleaner2 ★★★☆☆  "OK"        [VT]   Dec 25│
│  cs_test...  cleaner1 ★★☆☆☆  "Poor"      [NJ]   Dec 24│
│              (highlighted in red - low rating)          │
└─────────────────────────────────────────────────────────┘
```

## Review Statistics Example

### Cleaner Review Stats

```typescript
{
  averageRating: 4.5,
  totalReviews: 25,
  last5Reviews: [
    { rating: 5, comment: "Excellent!", ... },
    { rating: 4, comment: "Good service", ... },
    { rating: 5, comment: "Perfect!", ... },
    { rating: 3, comment: "Could be better", ... },
    { rating: 5, comment: "Great!", ... }
  ],
  recleanRequestRate: 8.0, // 2 out of 25 requested re-clean
  ratingTrend: [5, 4, 5, 3, 5, 4] // Last 6 ratings
}
```

## Database Query Examples

### When Migrating to Database

```sql
-- Create review
INSERT INTO reviews (
  job_id, cleaner_id, service_location, rating, comment, request_reclean
) VALUES (
  'cs_test_abc123',
  'cleaner_1',
  'new_jersey',
  5,
  'Great service!',
  false
);

-- Get reviews for cleaner
SELECT * FROM reviews
WHERE cleaner_id = 'cleaner_1'
ORDER BY created_at DESC;

-- Calculate average rating
SELECT 
  cleaner_id,
  AVG(rating) as average_rating,
  COUNT(*) as total_reviews
FROM reviews
WHERE cleaner_id = 'cleaner_1'
GROUP BY cleaner_id;

-- Get low ratings requiring follow-up
SELECT * FROM reviews
WHERE rating <= 3
ORDER BY created_at DESC;
```



