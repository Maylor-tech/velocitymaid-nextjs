# 24-Hour WhatsApp Reminder Setup Guide

**Date:** December 2024  
**Status:** Ready for Deployment

---

## 📋 Overview

This system automatically sends WhatsApp reminders to customers 24 hours before their scheduled cleaning service using the approved template `reminder_24h_v3`.

---

## ✅ Implementation Complete

### Files Created

1. **`lib/whatsapp.ts`** - WhatsApp Cloud API utility functions
   - `sendWhatsAppTemplate()` - Generic template sender
   - `send24HourReminder()` - Specific 24-hour reminder sender
   - Phone number formatting
   - Service type and date formatting

2. **`app/api/cron/reminder-24h/route.ts`** - Cron job API endpoint
   - Fetches bookings from Stripe
   - Filters bookings that are 24 hours away
   - Sends WhatsApp reminders
   - Tracks sent reminders in Stripe metadata
   - Comprehensive logging

3. **`vercel.json`** - Vercel cron configuration
   - Runs daily at midnight (server time)

---

## 🔧 Environment Variables Required

Add these to your `.env.local` file and Vercel environment variables:

```env
# WhatsApp Configuration
WHATSAPP_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# Stripe Configuration (already configured)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

### How to Get WhatsApp Credentials

1. **WhatsApp Access Token:**
   - Go to Meta Business Manager
   - Navigate to WhatsApp → API Setup
   - Copy the "Temporary Access Token" or create a permanent token
   - Store in `WHATSAPP_TOKEN`

2. **Phone Number ID:**
   - In Meta Business Manager → WhatsApp → API Setup
   - Find your "Phone number ID" (numeric ID)
   - Store in `WHATSAPP_PHONE_NUMBER_ID`

---

## 🚀 Deployment Steps

### Step 1: Set Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `WHATSAPP_TOKEN` = Your WhatsApp access token
   - `WHATSAPP_PHONE_NUMBER_ID` = Your phone number ID
3. Redeploy your application

### Step 2: Verify Cron Job is Active

1. After deployment, go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Verify the cron job appears:
   - **Path:** `/api/cron/reminder-24h`
   - **Schedule:** `0 0 * * *` (daily at midnight UTC)

### Step 3: Test the Endpoint

Test the cron job manually:

```bash
# Test locally (if running dev server)
curl http://localhost:3000/api/cron/reminder-24h?test=true

# Test on production
curl https://velocitymaid.com/api/cron/reminder-24h?test=true
```

---

## 🧪 Manual Testing Instructions

### Test with a Real Booking

1. **Create a Test Booking:**
   - Submit a booking through the booking form
   - Use a date that is exactly 24 hours from now
   - Complete the Stripe payment

2. **Run the Cron Job:**
   ```bash
   # In production
   curl https://velocitymaid.com/api/cron/reminder-24h?test=true
   
   # Or visit in browser
   https://velocitymaid.com/api/cron/reminder-24h?test=true
   ```

3. **Check the Response:**
   - Should return JSON with `success: true`
   - Check `remindersSent` count
   - Review the `log` array for detailed information

4. **Verify WhatsApp Message:**
   - Check the customer's WhatsApp
   - Should receive reminder message with booking details

### Test Response Example

```json
{
  "success": true,
  "remindersSent": 1,
  "remindersFailed": 0,
  "totalBookings": 1,
  "results": [
    {
      "booking": {
        "sessionId": "cs_test_...",
        "customerName": "John D",
        "phone": "+1234567890",
        "serviceType": "basic",
        "preferredDate": "2024-12-26",
        "preferredTime": "10:00 AM",
        "address": "123 Main St"
      },
      "success": true
    }
  ],
  "log": [
    "[2024-12-25T00:00:00.000Z] Starting 24-hour reminder cron job",
    "Fetching upcoming bookings from Stripe...",
    "Found 1 booking(s) requiring reminders",
    "Sending reminder to John D (+1234567890)...",
    "SUCCESS: Reminder sent to John D (Message ID: wamid.xxx)",
    "[2024-12-25T00:00:01.500Z] Cron job completed in 1500ms",
    "Summary: 1 sent, 0 failed"
  ],
  "duration": "1500ms"
}
```

---

## 📊 How It Works

### 1. **Booking Detection**

- Queries Stripe for completed checkout sessions from the last 7 days
- Extracts booking data from Stripe metadata:
  - `preferredDate` - Service date
  - `preferredTime` - Service time
  - `phone` - Customer phone number
  - `firstName`, `lastInitial` - Customer name
  - `serviceType` - Service type
  - `address` - Service address
  - `reminder24hSent` - Whether reminder was already sent

### 2. **24-Hour Window Check**

- Calculates time until booking
- Sends reminder if booking is between **23-25 hours** away (1-hour window)
- This ensures reminders go out even if cron runs slightly early/late

### 3. **Duplicate Prevention**

- Checks `reminder24hSent` metadata flag
- Skips bookings that already received a reminder
- Marks reminder as sent in Stripe metadata after successful send

### 4. **WhatsApp Message**

- Formats customer name, service type, date, and address
- Sends using template `reminder_24h_v3` with language `en_US`
- Parameters in order:
  1. Client name
  2. Service type (formatted)
  3. Scheduled date (formatted)
  4. Time slot
  5. Service address

### 5. **Rate Limiting**

- Waits 1 second between messages to avoid API rate limits
- Processes bookings sequentially

---

## 🔍 Monitoring & Logging

### Logs Include

- Start/end timestamps
- Number of bookings found
- Success/failure for each reminder
- Error messages if any
- Total execution time

### Viewing Logs

**Vercel:**
- Go to Vercel Dashboard → Your Project → Logs
- Filter by function: `reminder-24h`

**Manual Check:**
- Call the endpoint and review the `log` array in the response

---

## 🛠️ Troubleshooting

### Issue: No reminders being sent

**Check:**
1. Environment variables are set correctly
2. WhatsApp template `reminder_24h_v3` is approved in Meta Business Manager
3. Phone numbers are in correct format (with country code)
4. Bookings exist in Stripe with proper metadata
5. Bookings are actually 24 hours away

**Debug:**
- Call endpoint with `?test=true` parameter
- Review the `log` array in response
- Check for error messages

### Issue: Reminders sent multiple times

**Solution:**
- The system tracks `reminder24hSent` in Stripe metadata
- If this flag is set, reminder won't be sent again
- Check Stripe metadata to verify flag is being set

### Issue: WhatsApp API errors

**Common Errors:**
- `Invalid phone number` - Check phone format
- `Template not found` - Verify template name is `reminder_24h_v3`
- `Rate limit exceeded` - System includes 1-second delay, but may need more
- `Invalid access token` - Verify `WHATSAPP_TOKEN` is correct

**Fix:**
- Review error in response `log` array
- Check WhatsApp Business API documentation
- Verify credentials in Meta Business Manager

---

## 📝 WhatsApp Template Requirements

### Template Name
`reminder_24h_v3`

### Language Code
`en_US`

### Required Parameters (in order)
1. `client_name` - Customer name (e.g., "John D")
2. `service_type` - Service type (e.g., "Basic Clean")
3. `scheduled_date` - Formatted date (e.g., "Monday, December 25, 2024")
4. `time_slot` - Time (e.g., "10:00 AM")
5. `service_address` - Full address

### Template Approval

**Important:** The template must be approved in Meta Business Manager before use.

1. Go to Meta Business Manager
2. Navigate to WhatsApp → Message Templates
3. Verify `reminder_24h_v3` is approved
4. If not approved, submit for approval

---

## 🔄 Alternative Cron Setup (If Not Using Vercel)

If you're not using Vercel or want to use an external cron service:

### Option 1: cron-job.org

1. Sign up at https://cron-job.org
2. Create new cron job:
   - **URL:** `https://velocitymaid.com/api/cron/reminder-24h`
   - **Schedule:** Daily at midnight (your timezone)
   - **Method:** GET or POST
3. Save and activate

### Option 2: GitHub Actions

Create `.github/workflows/reminder-cron.yml`:

```yaml
name: 24-Hour Reminder Cron

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Reminder Endpoint
        run: |
          curl -X GET "https://velocitymaid.com/api/cron/reminder-24h"
```

---

## ✅ Verification Checklist

Before going live:

- [ ] Environment variables set in Vercel
- [ ] WhatsApp template `reminder_24h_v3` approved
- [ ] Test endpoint returns success
- [ ] Test with a real booking 24 hours away
- [ ] Verify WhatsApp message received
- [ ] Check logs for any errors
- [ ] Verify reminder tracking works (no duplicates)
- [ ] Cron job scheduled in Vercel (or external service)

---

## 📞 Support

If you encounter issues:

1. Check the endpoint response `log` array
2. Verify environment variables
3. Check WhatsApp Business API status
4. Review Stripe metadata for booking data
5. Test with `?test=true` parameter for detailed logs

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Deployment




