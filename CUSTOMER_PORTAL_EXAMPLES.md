# Customer Portal - Examples & Workflows

## Example Customer Data

### Customer Object

```typescript
{
  id: "customer_1703616000000_abc123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+19731234567",
  defaultAddress: "123 Main St, Newark, NJ 07102",
  region: "new_jersey",
  createdAt: "2024-12-01T10:00:00Z",
  updatedAt: "2024-12-26T10:00:00Z"
}
```

### Customer Preferences

```typescript
{
  id: "pref_1703616000000_abc123",
  customerId: "customer_1703616000000_abc123",
  preferredTimeWindow: "afternoon",
  preferredDayOfWeek: 1, // Monday
  notesForCleaner: "Please use eco-friendly products",
  allowWhatsApp: true,
  allowEmail: true,
  createdAt: "2024-12-01T10:00:00Z",
  updatedAt: "2024-12-26T10:00:00Z"
}
```

## API Request/Response Examples

### Customer Login

```bash
POST /api/customer/login
{
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": "customer_1703616000000_abc123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+19731234567"
  }
}
```

### List Bookings

```bash
GET /api/customer/bookings/list?type=upcoming
```

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": "cs_test_abc123",
      "sessionId": "cs_test_abc123",
      "customerEmail": "john.doe@example.com",
      "customerName": "John D",
      "preferredDate": "2024-12-30",
      "preferredTime": "afternoon",
      "serviceType": "deep",
      "serviceLocation": "new_jersey",
      "address": "123 Main St, Newark, NJ 07102",
      "status": "confirmed",
      "totalPrice": 120.00,
      "addOns": ["windows", "oven"],
      "specialInstructions": "Please use eco-friendly products",
      "assignedCleanerName": "Jane Cleaner",
      "createdAt": "2024-12-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Reschedule Booking

```bash
PATCH /api/customer/bookings/update
{
  "bookingId": "cs_test_abc123",
  "newDate": "2025-01-05",
  "newTimeWindow": "morning"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "booking": {
    "id": "cs_test_abc123",
    "preferredDate": "2025-01-05",
    "preferredTime": "morning",
    ...
  }
}
```

### Cancel Booking

```bash
POST /api/customer/bookings/cancel
{
  "bookingId": "cs_test_abc123",
  "reason": "Schedule conflict"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "id": "cs_test_abc123",
    "status": "cancelled_by_customer",
    "cancelledAt": "2024-12-26T14:30:00Z",
    ...
  }
}
```

### Update Preferences

```bash
PATCH /api/customer/preferences/update
{
  "preferredTimeWindow": "afternoon",
  "preferredDayOfWeek": 1,
  "notesForCleaner": "Please use eco-friendly products",
  "allowWhatsApp": true,
  "allowEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "id": "pref_1703616000000_abc123",
    "customerId": "customer_1703616000000_abc123",
    "preferredTimeWindow": "afternoon",
    "preferredDayOfWeek": 1,
    "notesForCleaner": "Please use eco-friendly products",
    "allowWhatsApp": true,
    "allowEmail": true,
    ...
  }
}
```

## UI Preview

### Customer Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Hi, John!                                              │
│  Welcome to your customer portal                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Next Upcoming Booking                                  │
│                                                         │
│  Deep Clean [New Jersey] [Confirmed]                    │
│  📅 Monday, December 30, 2024                           │
│  🕐 Afternoon                                           │
│  📍 123 Main St, Newark, NJ 07102                       │
│  💵 $120.00                                             │
│                                                         │
│  [View Details] [Reschedule] [Cancel]                   │
└─────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ View All │ │ Past     │ │ Update   │ │ Leave    │
│ Upcoming │ │ Cleanings│ │ Prefs    │ │ Review   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Booking Details Page

```
┌─────────────────────────────────────────────────────────┐
│  Booking Details                                        │
│                                                         │
│  Deep Clean [New Jersey] [Confirmed]                    │
│                                                         │
│  📅 Monday, December 30, 2024                           │
│  🕐 Afternoon                                           │
│  📍 123 Main St, Newark, NJ 07102                       │
│  💵 $120.00                                             │
│  👤 Assigned Cleaner: Jane Cleaner                     │
│                                                         │
│  Add-ons: [Windows] [Oven]                              │
│                                                         │
│  Special Instructions:                                 │
│  "Please use eco-friendly products"                     │
│                                                         │
│  [Reschedule] [Cancel Booking] [Contact Support]       │
└─────────────────────────────────────────────────────────┘
```

## Workflow Examples

### Rescheduling Workflow

1. Customer logs in → Dashboard
2. Clicks "View Details" on upcoming booking
3. Clicks "Reschedule"
4. Modal opens with date/time picker
5. Selects new date (must be > 24h away)
6. Selects new time window
7. Confirms reschedule
8. Booking updated in Stripe
9. Admin notified (TODO)

### Cancellation Workflow

1. Customer logs in → Dashboard
2. Clicks "Cancel" on upcoming booking
3. Confirmation modal opens
4. Enters reason (optional)
5. Confirms cancellation
6. Booking status set to "cancelled_by_customer"
7. Admin notified (TODO)
8. Redirected to dashboard

### Review Workflow

1. Customer views history
2. Sees completed booking with "Leave a review" button
3. Clicks button → Redirected to `/review/[jobId]`
4. Submits review with rating and comment
5. Review appears in history
6. If rating ≤ 3, complaint auto-created

## Database Query Examples

### When Migrating to Database

```sql
-- Find customer by email
SELECT * FROM customers
WHERE email = 'john.doe@example.com';

-- Get customer bookings
SELECT * FROM checkout_sessions
WHERE customer_email = 'john.doe@example.com'
ORDER BY preferred_date DESC;

-- Get customer preferences
SELECT * FROM customer_preferences
WHERE customer_id = 'customer_123';

-- Update preferences
UPDATE customer_preferences
SET 
  preferred_time_window = 'afternoon',
  preferred_day_of_week = 1,
  updated_at = NOW()
WHERE customer_id = 'customer_123';
```




