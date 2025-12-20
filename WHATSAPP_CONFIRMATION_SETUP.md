# WhatsApp Customer Confirmation Setup Guide

**Date:** December 2024  
**Status:** ✅ Complete and Ready for Testing

---

## 📋 Overview

Automated WhatsApp confirmation messages are sent to customers immediately after successful booking payment using the approved template `customer_confirm_v3`.

---

## ✅ Implementation Complete

### Files Created

1. **`lib/sendCustomerConfirmation.ts`** - WhatsApp confirmation utility
   - Generates confirmation numbers (VM + YYYYMMDD + random 4 digits)
   - Formats booking data for WhatsApp template
   - Sends confirmation via WhatsApp Cloud API

2. **`app/api/webhooks/stripe/route.ts`** - Stripe webhook handler
   - Handles `checkout.session.completed` events
   - Sends WhatsApp confirmation after successful payment
   - Stores confirmation number in Stripe metadata
   - Prevents duplicate confirmations

3. **`app/api/test/send-confirmation/route.ts`** - Test endpoint
   - Manual testing endpoint
   - Supports GET and POST methods
   - Useful for testing without creating real bookings

---

## 🔧 Environment Variables Required

Add to `.env.local` and Vercel:

```env
# WhatsApp Configuration (already configured)
WHATSAPP_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Stripe Configuration (already configured)
STRIPE_SECRET_KEY=your_stripe_secret_key

# Stripe Webhook Secret (for webhook signature verification)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## 🚀 Setup Steps

### Step 1: Configure Stripe Webhook

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com/webhooks
2. **Click:** "+ Add endpoint"
3. **Endpoint URL:** `https://velocitymaid.com/api/webhooks/stripe`
4. **Description:** "WhatsApp Confirmation Webhook"
5. **Events to send:** Select `checkout.session.completed`
6. **Click:** "Add endpoint"
7. **Copy the Signing Secret** (starts with `whsec_...`)
8. **Add to environment variables:** `STRIPE_WEBHOOK_SECRET`

### Step 2: Verify WhatsApp Template

1. **Go to Meta Business Manager**
2. **Navigate to:** WhatsApp → Message Templates
3. **Verify template:** `customer_confirm_v3` is approved
4. **Check language:** `en_US`
5. **Verify parameters:** 5 parameters in correct order

### Step 3: Deploy to Vercel

1. **Push code to repository**
2. **Vercel will auto-deploy**
3. **Set environment variables in Vercel:**
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `STRIPE_WEBHOOK_SECRET`
4. **Redeploy if needed**

---

## 🧪 Testing Instructions

### Test 1: Manual Test Endpoint (Recommended First)

**Using GET (Browser or curl):**

```bash
# Replace with your test phone number
curl "https://velocitymaid.com/api/test/send-confirmation?phone=+1234567890&serviceType=basic&date=2024-12-26&time=10:00 AM&address=123 Main St, Newark, NJ"
```

**Using POST (More detailed):**

```bash
curl -X POST https://velocitymaid.com/api/test/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "serviceType": "basic",
    "preferredDate": "2024-12-26",
    "preferredTime": "10:00 AM",
    "address": "123 Main Street, Newark, NJ 07102"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "WhatsApp confirmation sent successfully",
  "confirmationNumber": "VM20241226-5821",
  "messageId": "wamid.xxx",
  "timestamp": "2024-12-25T12:00:00.000Z"
}
```

### Test 2: End-to-End Test with Real Booking

1. **Create a test booking:**
   - Go to booking form
   - Fill in all required fields
   - Use a test phone number you can verify
   - Complete Stripe payment (use test mode)

2. **Verify webhook received:**
   - Check Stripe Dashboard → Webhooks → Your endpoint
   - Should show successful delivery

3. **Check WhatsApp:**
   - Customer should receive confirmation message
   - Verify all details are correct

4. **Check Stripe metadata:**
   - Go to Stripe Dashboard → Payments → Your payment
   - Check metadata for:
     - `confirmationNumber`: VM20241226-XXXX
     - `whatsappConfirmationSent`: true
     - `whatsappConfirmationSentAt`: timestamp

---

## 📊 How It Works

### Flow Diagram

```
1. Customer Completes Booking Payment
   ↓
2. Stripe Sends checkout.session.completed Webhook
   ↓
3. Webhook Handler Verifies Signature
   ↓
4. Extract Booking Data from Stripe Metadata
   ↓
5. Check if Confirmation Already Sent (Prevent Duplicates)
   ↓
6. Generate Confirmation Number (VM + YYYYMMDD + 4 digits)
   ↓
7. Format Booking Data:
   - Service Type → "Basic Clean"
   - Date → "YYYY-MM-DD"
   - Time → "Morning/Afternoon/Evening"
   - Address → Full address
   ↓
8. Send WhatsApp Template Message
   ↓
9. Store Confirmation Number in Stripe Metadata
   ↓
10. Log Success/Failure
```

### Confirmation Number Format

**Format:** `VM + YYYYMMDD + random 4 digits`

**Examples:**
- `VM20241226-5821`
- `VM20241227-3847`
- `VM20241228-9201`

**Generation Logic:**
- `VM` = VelocityMaid prefix
- `YYYYMMDD` = Booking date (year, month, day)
- `XXXX` = Random 4-digit number (1000-9999)

### Time Slot Formatting

The system converts time strings to Morning/Afternoon/Evening:

- **Morning:** 5:00 AM - 11:59 AM
- **Afternoon:** 12:00 PM - 4:59 PM
- **Evening:** 5:00 PM - 4:59 AM

**Examples:**
- `"10:00 AM"` → `"Morning"`
- `"2:00 PM"` → `"Afternoon"`
- `"6:00 PM"` → `"Evening"`

---

## 📝 WhatsApp Template Parameters

### Template: `customer_confirm_v3`
### Language: `en_US`

**Parameters (in order):**

| Position | Parameter | Source | Example |
|----------|-----------|--------|---------|
| 1 | `service_type` | `booking.serviceType` (formatted) | "Basic Clean" |
| 2 | `scheduled_date` | `booking.preferredDate` (YYYY-MM-DD) | "2024-12-26" |
| 3 | `time_slot` | `booking.preferredTime` (formatted) | "Morning" |
| 4 | `service_address` | `booking.address` | "123 Main St, Newark, NJ" |
| 5 | `confirmation_number` | Generated | "VM20241226-5821" |

---

## 🔍 Logging & Monitoring

### Console Logs

The system logs all operations:

**Success:**
```
[TEST] Sending WhatsApp confirmation to +1234567890
[TEST] Confirmation number: VM20241226-5821
[TEST] SUCCESS: Confirmation sent (Message ID: wamid.xxx)
```

**Webhook Processing:**
```
[2024-12-25T12:00:00.000Z] Stripe webhook received
Event type: checkout.session.completed
Event ID: evt_xxx
Processing checkout session: cs_test_xxx
Payment status: paid
SUCCESS: WhatsApp confirmation sent (Confirmation: VM20241226-5821)
Processing completed in 1500ms
```

**Errors:**
```
ERROR: Missing required booking data in Stripe session metadata
ERROR: WhatsApp credentials not configured
ERROR: Invalid webhook signature
```

### Viewing Logs

**Vercel:**
- Go to Vercel Dashboard → Your Project → Logs
- Filter by function: `webhooks/stripe` or `test/send-confirmation`

**Stripe:**
- Go to Stripe Dashboard → Webhooks → Your endpoint
- View webhook delivery logs

---

## 🛠️ Troubleshooting

### Issue: Confirmation not being sent

**Check:**
1. ✅ Webhook endpoint is configured in Stripe
2. ✅ `STRIPE_WEBHOOK_SECRET` is set correctly
3. ✅ `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set
4. ✅ WhatsApp template `customer_confirm_v3` is approved
5. ✅ Webhook is receiving events (check Stripe dashboard)

**Debug:**
- Use test endpoint to verify WhatsApp credentials work
- Check Stripe webhook delivery logs
- Review console logs for errors

### Issue: Duplicate confirmations

**Solution:**
- System checks `whatsappConfirmationSent` metadata flag
- If flag is `true`, confirmation is skipped
- Check Stripe metadata to verify flag is being set

### Issue: Invalid phone number

**Check:**
- Phone number format (should include country code)
- Examples: `+1234567890`, `+18027335348`
- System automatically formats phone numbers

### Issue: WhatsApp API errors

**Common Errors:**
- `Invalid phone number` - Check phone format
- `Template not found` - Verify template name is `customer_confirm_v3`
- `Rate limit exceeded` - Wait and retry
- `Invalid access token` - Verify `WHATSAPP_TOKEN` is correct

**Fix:**
- Review error in response
- Check WhatsApp Business API documentation
- Verify credentials in Meta Business Manager

---

## ✅ Verification Checklist

Before going live:

- [ ] `WHATSAPP_TOKEN` set in environment variables
- [ ] `WHATSAPP_PHONE_NUMBER_ID` set in environment variables
- [ ] `STRIPE_WEBHOOK_SECRET` set in environment variables
- [ ] Stripe webhook endpoint configured
- [ ] WhatsApp template `customer_confirm_v3` approved
- [ ] Test endpoint works (`/api/test/send-confirmation`)
- [ ] Test with real booking and verify confirmation sent
- [ ] Verify confirmation number stored in Stripe metadata
- [ ] Check customer receives WhatsApp message
- [ ] Verify no duplicate confirmations sent

---

## 📞 Support

If you encounter issues:

1. **Check test endpoint:** `/api/test/send-confirmation`
2. **Review Stripe webhook logs** in Stripe dashboard
3. **Check Vercel function logs** for errors
4. **Verify environment variables** are set correctly
5. **Test WhatsApp credentials** using test endpoint

---

## 📄 Example Logs

### Successful Test Endpoint Call

```json
{
  "success": true,
  "message": "WhatsApp confirmation sent successfully",
  "confirmationNumber": "VM20241226-5821",
  "messageId": "wamid.HBgNMTIzNDU2Nzg5MAIR",
  "timestamp": "2024-12-25T12:00:00.000Z"
}
```

### Successful Webhook Processing

```json
{
  "received": true,
  "eventType": "checkout.session.completed",
  "success": true,
  "confirmationNumber": "VM20241226-5821",
  "log": [
    "[2024-12-25T12:00:00.000Z] Stripe webhook received",
    "Event type: checkout.session.completed",
    "Event ID: evt_3Qxxx",
    "Processing checkout session: cs_test_xxx",
    "Payment status: paid",
    "SUCCESS: WhatsApp confirmation sent (Confirmation: VM20241226-5821)",
    "Processing completed in 1500ms"
  ],
  "duration": "1500ms"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Missing required booking data",
  "log": [
    "[2024-12-25T12:00:00.000Z] Stripe webhook received",
    "Event type: checkout.session.completed",
    "ERROR: Missing required booking data in Stripe session metadata"
  ]
}
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Deployment




