# WhatsApp Cleaner Assignment Setup Guide

**Date:** December 2024  
**Status:** ✅ Complete and Ready for Testing

---

## 📋 Overview

Automated WhatsApp notifications are sent to cleaners immediately when they are assigned to a booking using the approved template `cleaner_job_v3`.

---

## ✅ Implementation Complete

### Files Created

1. **`lib/sendCleanerAssignment.ts`** (NEW) - Cleaner assignment utility
   - Formats booking data for WhatsApp template
   - Sends cleaner assignment notification via WhatsApp Cloud API
   - Handles time slot conversion (Morning/Afternoon/Evening)
   - Error handling and logging

2. **`app/api/bookings/assign-cleaner/route.ts`** (NEW) - Cleaner assignment API
   - Assigns cleaner to booking (Stripe session)
   - Sends WhatsApp notification automatically
   - Stores assignment in Stripe metadata
   - Non-blocking (doesn't fail if WhatsApp fails)

3. **`app/api/test/send-cleaner-assignment/route.ts`** (NEW) - Test endpoint
   - Manual testing without assigning to real booking
   - Supports GET and POST methods

---

## 🔧 Environment Variables Required

Already configured (no new variables needed):

```env
# WhatsApp Configuration (already configured)
WHATSAPP_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Stripe Configuration (already configured)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

---

## 🚀 How to Assign a Cleaner

### Method 1: Using the API Route (Recommended)

**Endpoint:** `POST /api/bookings/assign-cleaner`

**Request Body:**
```json
{
  "sessionId": "cs_test_abc123...",
  "cleaner": {
    "phone": "+18027335348",
    "name": "John Cleaner"
  }
}
```

**Example:**
```bash
curl -X POST https://velocitymaid.com/api/bookings/assign-cleaner \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cs_test_abc123",
    "cleaner": {
      "phone": "+18027335348",
      "name": "John Cleaner"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Cleaner assigned successfully",
  "cleanerAlertSent": true,
  "messageId": "wamid.xxx",
  "cleaner": {
    "phone": "+18027335348",
    "name": "John Cleaner"
  },
  "booking": {
    "customerName": "Jane D",
    "serviceType": "basic",
    "scheduledDate": "2024-12-26",
    "timeSlot": "Morning",
    "address": "123 Main St, Newark, NJ"
  },
  "log": [...],
  "duration": "1500ms"
}
```

### Method 2: Integration in Your Dispatch System

If you have a dispatch system, call the API route after assigning:

```typescript
// After cleaner is assigned in your system
const response = await fetch('/api/bookings/assign-cleaner', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: bookingSessionId,
    cleaner: {
      phone: cleaner.phone, // Must be E.164 format
      name: cleaner.name,    // Optional
    },
  }),
});
```

---

## 🧪 Testing Instructions

### Test 1: Manual Test Endpoint (Recommended First)

**Using GET (Browser or curl):**

```bash
curl "https://velocitymaid.com/api/test/send-cleaner-assignment?cleanerPhone=+18027335348&cleanerName=John Cleaner&customerName=Jane D&serviceType=basic&date=2024-12-26&time=10:00 AM&address=123 Main St, Newark, NJ"
```

**Using POST (More detailed):**

```bash
curl -X POST https://velocitymaid.com/api/test/send-cleaner-assignment \
  -H "Content-Type: application/json" \
  -d '{
    "cleaner": {
      "phone": "+18027335348",
      "name": "John Cleaner"
    },
    "booking": {
      "customerName": "Jane D",
      "serviceType": "basic",
      "preferredDate": "2024-12-26",
      "preferredTime": "10:00 AM",
      "address": "123 Main Street, Newark, NJ 07102"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cleaner assignment notification sent successfully",
  "messageId": "wamid.xxx",
  "timestamp": "2024-12-25T12:00:00.000Z"
}
```

### Test 2: End-to-End Test with Real Booking

1. **Create a test booking:**
   - Submit booking through booking form
   - Complete Stripe payment
   - Note the session ID from success page or Stripe dashboard

2. **Assign cleaner:**
   ```bash
   curl -X POST https://velocitymaid.com/api/bookings/assign-cleaner \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "cs_test_xxx",
       "cleaner": {
         "phone": "+18027335348",
         "name": "John Cleaner"
       }
     }'
   ```

3. **Verify:**
   - Check cleaner's WhatsApp for notification
   - Verify all details are correct
   - Check Stripe metadata for assignment info

---

## 📊 How It Works

### Flow Diagram

```
1. Admin/Dispatch Assigns Cleaner to Booking
   ↓
2. POST /api/bookings/assign-cleaner
   ↓
3. Retrieve Booking from Stripe Session
   ↓
4. Extract Booking Data from Metadata
   ↓
5. Send WhatsApp Notification to Cleaner
   ↓
6. Update Stripe Metadata with Assignment
   ↓
7. Return Success Response
```

### Assignment Process

1. **Receive assignment request** with sessionId and cleaner info
2. **Retrieve Stripe session** to get booking data
3. **Extract booking data** from session metadata:
   - Customer name (firstName + lastInitial)
   - Service type
   - Preferred date
   - Preferred time
   - Address
4. **Format data** for WhatsApp template
5. **Send WhatsApp message** to cleaner
6. **Update Stripe metadata** with:
   - `assignedCleanerPhone`
   - `assignedCleanerName`
   - `assignedCleanerAt`
   - `cleanerAlertSent`
   - `cleanerAlertMessageId`

### Time Slot Conversion

The system automatically converts time strings to Morning/Afternoon/Evening:

- **Morning:** 5:00 AM - 11:59 AM
- **Afternoon:** 12:00 PM - 4:59 PM
- **Evening:** 5:00 PM - 4:59 AM

**Examples:**
- `"10:00 AM"` → `"Morning"`
- `"2:00 PM"` → `"Afternoon"`
- `"6:00 PM"` → `"Evening"`

---

## 📝 WhatsApp Template Parameters

### Template: `cleaner_job_v3`
### Language: `en_US`

**Parameters (in order):**

| Position | Parameter | Source | Example |
|----------|-----------|--------|---------|
| 1 | `client_name` | `booking.customerName` | "Jane D" |
| 2 | `service_type` | `booking.serviceType` (formatted) | "Basic Clean" |
| 3 | `scheduled_date` | `booking.preferredDate` (YYYY-MM-DD) | "2024-12-26" |
| 4 | `time_slot` | `formatTimeSlot(preferredTime)` | "Morning" |
| 5 | `service_address` | `booking.address` | "123 Main St, Newark, NJ" |

---

## 🔍 Logging & Monitoring

### Console Logs

**Success:**
```
Cleaner notified: John Cleaner +18027335348
Cleaner assignment sent successfully: {
  messageId: 'wamid.xxx',
  cleanerName: 'John Cleaner',
  cleanerPhone: '+18027335348',
  customerName: 'Jane D',
  serviceType: 'Basic Clean',
  scheduledDate: '2024-12-26'
}
```

**Test Endpoint:**
```
[TEST] Sending cleaner assignment to +18027335348
[TEST] Cleaner: John Cleaner, Customer: Jane D
[TEST] SUCCESS: Cleaner assignment sent (Message ID: wamid.xxx)
```

**Assignment API:**
```
[2024-12-25T12:00:00.000Z] Assigning cleaner to booking cs_test_xxx
Sending WhatsApp notification to cleaner +18027335348...
SUCCESS: Cleaner notification sent (Message ID: wamid.xxx)
Stripe metadata updated with cleaner assignment
Assignment completed in 1500ms
```

**Error:**
```
Cleaner assignment failed: {
  error: 'Invalid phone number format',
  cleanerName: 'John Cleaner',
  cleanerPhone: '+18027335348',
  customerName: 'Jane D'
}
```

### Viewing Logs

**Vercel:**
- Go to Vercel Dashboard → Your Project → Logs
- Filter by function: `bookings/assign-cleaner` or `test/send-cleaner-assignment`

---

## 🛠️ Troubleshooting

### Issue: Cleaner notification not being sent

**Check:**
1. ✅ `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set
2. ✅ WhatsApp template `cleaner_job_v3` is approved
3. ✅ Cleaner phone number is in E.164 format (`+18027335348`)
4. ✅ Booking session exists in Stripe
5. ✅ Booking metadata contains required fields

**Debug:**
- Use test endpoint to verify WhatsApp credentials work
- Check API response logs
- Verify cleaner phone number format
- Check Stripe session metadata

### Issue: Invalid phone number

**Check:**
- Phone number must include country code
- Format: `+[country code][number]`
- Examples:
  - ✅ `+18027335348` (US)
  - ✅ `+442071234567` (UK)
  - ❌ `18027335348` (missing +)
  - ❌ `802-733-5348` (wrong format)

### Issue: Assignment blocking flow

**Solution:**
- WhatsApp notification is **non-blocking** by design
- Uses try/catch to handle errors
- Errors are logged but don't affect assignment
- Check logs to see if notification failed

### Issue: Duplicate assignments

**Solution:**
- System checks if cleaner is already assigned
- If same cleaner phone, returns success without resending
- Check Stripe metadata `assignedCleanerPhone` field

---

## ✅ Verification Checklist

Before going live:

- [ ] `WHATSAPP_TOKEN` set in environment variables
- [ ] `WHATSAPP_PHONE_NUMBER_ID` set in environment variables
- [ ] WhatsApp template `cleaner_job_v3` approved
- [ ] Test endpoint works (`/api/test/send-cleaner-assignment`)
- [ ] Test with real booking and verify cleaner receives notification
- [ ] Verify assignment stored in Stripe metadata
- [ ] Check logs for any errors
- [ ] Verify notification doesn't block assignment flow

---

## 📞 Support

If you encounter issues:

1. **Check test endpoint:** `/api/test/send-cleaner-assignment`
2. **Review API response logs** for errors
3. **Verify environment variables** are set correctly
4. **Test WhatsApp credentials** using test endpoint
5. **Verify cleaner phone number** is in E.164 format
6. **Check Stripe session** exists and has metadata

---

## 📄 Example Logs

### Successful Assignment

**Console Output:**
```
[2024-12-25T12:00:00.000Z] Assigning cleaner to booking cs_test_abc123
Sending WhatsApp notification to cleaner +18027335348...
Cleaner notified: John Cleaner +18027335348
Cleaner assignment sent successfully: {
  messageId: 'wamid.HBgNMTgwMjczMzUzNDgA',
  cleanerName: 'John Cleaner',
  cleanerPhone: '+18027335348',
  customerName: 'Jane D',
  serviceType: 'Basic Clean',
  scheduledDate: '2024-12-26'
}
SUCCESS: Cleaner notification sent (Message ID: wamid.xxx)
Stripe metadata updated with cleaner assignment
Assignment completed in 1500ms
```

**API Response:**
```json
{
  "success": true,
  "message": "Cleaner assigned successfully",
  "cleanerAlertSent": true,
  "messageId": "wamid.HBgNMTgwMjczMzUzNDgA",
  "cleaner": {
    "phone": "+18027335348",
    "name": "John Cleaner"
  },
  "booking": {
    "customerName": "Jane D",
    "serviceType": "basic",
    "scheduledDate": "2024-12-26",
    "timeSlot": "Morning",
    "address": "123 Main Street, Newark, NJ 07102"
  },
  "log": [
    "[2024-12-25T12:00:00.000Z] Assigning cleaner to booking cs_test_abc123",
    "Sending WhatsApp notification to cleaner +18027335348...",
    "SUCCESS: Cleaner notification sent (Message ID: wamid.xxx)",
    "Stripe metadata updated with cleaner assignment",
    "Assignment completed in 1500ms"
  ],
  "duration": "1500ms"
}
```

### Test Endpoint Output

**Console:**
```
[TEST] Sending cleaner assignment to +18027335348
[TEST] Cleaner: John Cleaner, Customer: Jane D
Cleaner notified: John Cleaner +18027335348
Cleaner assignment sent successfully: {
  messageId: 'wamid.xxx',
  cleanerName: 'John Cleaner',
  cleanerPhone: '+18027335348',
  customerName: 'Jane D',
  serviceType: 'Basic Clean',
  scheduledDate: '2024-12-26'
}
[TEST] SUCCESS: Cleaner assignment sent (Message ID: wamid.xxx)
```

**Response:**
```json
{
  "success": true,
  "message": "Cleaner assignment notification sent successfully",
  "messageId": "wamid.HBgNMTgwMjczMzUzNDgA",
  "timestamp": "2024-12-25T12:00:00.000Z"
}
```

### Error Response

**Console:**
```
Cleaner assignment failed: {
  error: 'Invalid phone number format',
  cleanerName: 'John Cleaner',
  cleanerPhone: '802-733-5348',
  customerName: 'Jane D'
}
```

**API Response:**
```json
{
  "success": false,
  "error": "Invalid phone number format",
  "log": [
    "[2024-12-25T12:00:00.000Z] Assigning cleaner to booking cs_test_xxx",
    "Sending WhatsApp notification to cleaner 802-733-5348...",
    "FAILED: Cleaner notification failed - Invalid phone number format"
  ]
}
```

---

## 🔄 Integration Example

### In Your Dispatch System

```typescript
// Example: Assign cleaner after admin selects cleaner
async function assignCleanerToBooking(sessionId: string, cleanerId: string) {
  // Get cleaner details from your database
  const cleaner = await getCleanerById(cleanerId);
  
  // Call assignment API
  const response = await fetch('/api/bookings/assign-cleaner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      cleaner: {
        phone: cleaner.phone, // Must be E.164: +18027335348
        name: cleaner.name,
      },
    }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Cleaner assigned:', result.cleanerAlertSent);
    return result;
  } else {
    console.error('Assignment failed:', result.error);
    throw new Error(result.error);
  }
}
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Deployment




