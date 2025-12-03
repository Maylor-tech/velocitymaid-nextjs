# Multi-Branch WhatsApp Routing System

## Overview

This system automatically routes WhatsApp notifications (admin alerts, cleaner assignments) to the correct state (New Jersey or Vermont) based on the booking's `serviceLocation` field.

## Environment Variables

Add these to your `.env.local` file (for local development) and Vercel environment variables (for production):

```bash
# New Jersey Admin
ADMIN_WHATSAPP_NJ="+1973xxxxxxx"

# Vermont Admin
ADMIN_WHATSAPP_VT="+1802xxxxxxx"

# New Jersey Cleaner Team (comma-separated)
CLEANER_TEAM_NJ="+1973xxxxxxx,+1973yyyyyyy,+1973zzzzzzz"

# Vermont Cleaner Team (comma-separated)
CLEANER_TEAM_VT="+1802xxxxxxx,+1802yyyyyyy,+1802zzzzzzz"

# Existing WhatsApp credentials (used by all regions)
WHATSAPP_TOKEN="your_whatsapp_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
```

### Format Requirements

- **Phone Numbers**: Must be in E.164 format (e.g., `+19731234567`)
- **Cleaner Lists**: Comma-separated, no spaces (or spaces will be trimmed automatically)
- **Fallback**: If `ADMIN_WHATSAPP_NJ` is not set, the system will fall back to `ADMIN_WHATSAPP` (if set)

## Service Location Values

The `serviceLocation` field must be one of:
- `"new_jersey"` → Routes to NJ admin and NJ cleaner team
- `"vermont"` → Routes to VT admin and VT cleaner team

If `serviceLocation` is missing or invalid, defaults to `"new_jersey"`.

## How It Works

### 1. Admin Notifications

When a booking is created, the system:
1. Reads `booking.serviceLocation`
2. Calls `getAdminNumber(serviceLocation)` to get the correct admin phone
3. Sends WhatsApp notification to that admin

**Example:**
- NJ booking → Admin notification goes to `ADMIN_WHATSAPP_NJ`
- VT booking → Admin notification goes to `ADMIN_WHATSAPP_VT`

### 2. Cleaner Assignments

When a cleaner is assigned:
1. System validates the cleaner belongs to the booking's region
2. If valid, sends WhatsApp notification to the assigned cleaner
3. If invalid, returns error: "Cleaner is not part of this service region"

**Region Validation:**
- NJ booking can only assign cleaners from `CLEANER_TEAM_NJ`
- VT booking can only assign cleaners from `CLEANER_TEAM_VT`

### 3. Bulk Cleaner Notifications

The system supports sending to all cleaners in a region:
- `sendCleanerAssignmentToRegion()` sends to all cleaners in the booking's region
- Includes rate limiting (1 second delay between messages)

## API Routes

### Assign Cleaner (with Region Validation)

**POST** `/api/bookings/assign-cleaner`

```json
{
  "sessionId": "cs_test_...",
  "cleaner": {
    "phone": "+1973xxxxxxx",
    "name": "John Cleaner"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Cleaner assigned successfully",
  "cleanerAlertSent": true,
  "messageId": "wamid.xxx",
  "booking": {
    "customerName": "John D",
    "serviceType": "Basic Clean",
    "scheduledDate": "2024-12-26",
    "timeSlot": "Morning",
    "address": "123 Main St",
    "serviceLocation": "new_jersey",
    "region": "New Jersey"
  }
}
```

**Response (Region Mismatch Error):**
```json
{
  "success": false,
  "error": "Cleaner is not part of this service region (New Jersey). Please assign a cleaner from the New Jersey team.",
  "serviceLocation": "new_jersey",
  "region": "New Jersey"
}
```

## Test Cases

### Example 1: New Jersey Booking

```json
{
  "serviceLocation": "new_jersey",
  "customerPhone": "+1973xxxxxxx",
  "assignedCleaner": "+1973xxxxxxx",
  "admin": "ADMIN_WHATSAPP_NJ"
}
```

**Expected Behavior:**
- Admin notification → `ADMIN_WHATSAPP_NJ`
- Cleaner assignment → Valid if cleaner is in `CLEANER_TEAM_NJ`
- Region label → "New Jersey"

### Example 2: Vermont Booking

```json
{
  "serviceLocation": "vermont",
  "customerPhone": "+1802xxxxxxx",
  "assignedCleaner": "+1802xxxxxxx",
  "admin": "ADMIN_WHATSAPP_VT"
}
```

**Expected Behavior:**
- Admin notification → `ADMIN_WHATSAPP_VT`
- Cleaner assignment → Valid if cleaner is in `CLEANER_TEAM_VT`
- Region label → "Vermont"

## Testing

### Test Admin Notification (with Routing)

**GET** `/api/test/send-admin-notification?serviceLocation=new_jersey&customerName=John D&serviceType=basic&totalPrice=120&date=2024-12-26&address=123 Main St`

**POST** `/api/test/send-admin-notification`
```json
{
  "customerName": "John D",
  "serviceType": "basic",
  "totalPrice": 120,
  "address": "123 Main St",
  "preferredDate": "2024-12-26",
  "serviceLocation": "new_jersey"
}
```

### Test Cleaner Assignment (with Region Validation)

**POST** `/api/test/send-cleaner-assignment`
```json
{
  "cleaner": {
    "phone": "+1973xxxxxxx",
    "name": "John Cleaner"
  },
  "booking": {
    "customerName": "Jane S",
    "serviceType": "deep",
    "preferredDate": "2024-12-26",
    "preferredTime": "10:00 AM",
    "address": "456 Oak Ave, Newark, NJ",
    "serviceLocation": "new_jersey"
  }
}
```

## Logs

The system logs include region information:

```
Admin notification sent successfully [New Jersey]: {
  messageId: "wamid.xxx",
  customerName: "John D",
  serviceType: "Basic Clean",
  paymentAmount: "$120.00",
  region: "New Jersey",
  adminPhone: "+1973xxxxxxx"
}
```

```
Cleaner notified [New Jersey]: John Cleaner +1973xxxxxxx
Region validation passed: Cleaner +1973xxxxxxx is valid for New Jersey
```

## Files Modified

1. **`lib/whatsappRouter.ts`** (NEW)
   - `getAdminNumber(serviceLocation)` - Gets admin phone for region
   - `getCleanerList(serviceLocation)` - Gets cleaner list for region
   - `formatLocation(serviceLocation)` - Formats location for display
   - `isCleanerInRegion(cleanerPhone, serviceLocation)` - Validates cleaner region

2. **`lib/sendAdminNotification.ts`** (UPDATED)
   - Now uses routing to select correct admin
   - Accepts `serviceLocation` in booking data
   - Logs include region information

3. **`lib/sendCleanerAssignment.ts`** (UPDATED)
   - Added `validateCleanerRegion()` function
   - Added `sendCleanerAssignmentToRegion()` for bulk notifications
   - Logs include region information

4. **`app/api/bookings/assign-cleaner/route.ts`** (UPDATED)
   - Validates cleaner belongs to booking's region
   - Includes `serviceLocation` in booking object
   - Returns region information in response

5. **`app/api/webhooks/stripe/route.ts`** (UPDATED)
   - Admin notification now uses routing
   - Includes `serviceLocation` from metadata

6. **`app/api/test/send-admin-notification/route.ts`** (UPDATED)
   - Updated to use new `sendAdminNotification` signature
   - Supports `serviceLocation` parameter

## Vercel Deployment

1. **Add Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables listed in "Environment Variables" section above

2. **Verify Configuration:**
   - Test with both `serviceLocation: "new_jersey"` and `serviceLocation: "vermont"`
   - Check logs to confirm correct routing

3. **Monitor Logs:**
   - Use Vercel's function logs to verify routing
   - Look for region labels in log messages

## Troubleshooting

### Admin Notifications Not Sending

- Check that `ADMIN_WHATSAPP_NJ` or `ADMIN_WHATSAPP_VT` is set
- Verify `serviceLocation` is included in booking metadata
- Check function logs for routing errors

### Cleaner Assignment Failing with Region Error

- Verify cleaner phone is in the correct `CLEANER_TEAM_*` list
- Check phone number format (must match exactly, including E.164 format)
- Ensure `serviceLocation` is set correctly in booking

### Defaulting to New Jersey

- If `serviceLocation` is missing, system defaults to `"new_jersey"`
- Ensure booking creation includes `serviceLocation` in metadata



