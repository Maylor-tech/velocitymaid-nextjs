# WhatsApp Admin Notification Setup Guide

**Date:** December 2024  
**Status:** ✅ Complete and Ready for Testing

---

## 📋 Overview

Automated WhatsApp notifications are sent to admin/manager immediately after a customer completes a booking payment using the approved template `admin_notify_v3`.

---

## ✅ Implementation Complete

### Files Created/Updated

1. **`lib/sendAdminNotification.ts`** (NEW) - Admin notification utility
   - Formats booking data for WhatsApp template
   - Sends admin notification via WhatsApp Cloud API
   - Handles errors gracefully

2. **`app/api/webhooks/stripe/route.ts`** (UPDATED) - Stripe webhook handler
   - Integrated admin notification after customer confirmation
   - Non-blocking (doesn't fail booking if admin notification fails)
   - Logs all operations

3. **`app/api/test/send-admin-notification/route.ts`** (NEW) - Test endpoint
   - Manual testing endpoint
   - Supports GET and POST methods

---

## 🔧 Environment Variables Required

Add to `.env.local` and Vercel:

```env
# WhatsApp Configuration (already configured)
WHATSAPP_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Admin WhatsApp Number (NEW - REQUIRED)
ADMIN_WHATSAPP=+18027335348
```

**Important:** 
- Phone number must be in E.164 format: `+[country code][number]`
- Example: `+18027335348` (US number)
- Example: `+442071234567` (UK number)

---

## 🚀 Setup Steps

### Step 1: Set Admin Phone Number

1. **Add to `.env.local`:**
   ```env
   ADMIN_WHATSAPP=+18027335348
   ```

2. **Add to Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `ADMIN_WHATSAPP` = `+18027335348` (or your admin number)
   - Redeploy

### Step 2: Verify WhatsApp Template

1. **Go to Meta Business Manager**
2. **Navigate to:** WhatsApp → Message Templates
3. **Verify template:** `admin_notify_v3` is approved
4. **Check language:** `en_US`
5. **Verify parameters:** 5 parameters in correct order

### Step 3: Test the Endpoint

Use the test endpoint to verify everything works before going live.

---

## 🧪 Testing Instructions

### Test 1: Manual Test Endpoint (Recommended First)

**Using GET (Browser or curl):**

```bash
curl "https://velocitymaid.com/api/test/send-admin-notification?customerName=John D&serviceType=basic&totalPrice=120&date=2024-12-26&address=123 Main St, Newark, NJ"
```

**Using POST (More detailed):**

```bash
curl -X POST https://velocitymaid.com/api/test/send-admin-notification \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John D",
    "serviceType": "basic",
    "totalPrice": 120,
    "address": "123 Main Street, Newark, NJ 07102",
    "preferredDate": "2024-12-26"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin notification sent successfully",
  "messageId": "wamid.xxx",
  "timestamp": "2024-12-25T12:00:00.000Z"
}
```

### Test 2: End-to-End Test with Real Booking

1. **Create a test booking:**
   - Go to booking form
   - Fill in all required fields
   - Complete Stripe payment (use test mode)

2. **Verify webhook received:**
   - Check Stripe Dashboard → Webhooks → Your endpoint
   - Should show successful delivery

3. **Check admin WhatsApp:**
   - Admin should receive notification message
   - Verify all details are correct

4. **Check logs:**
   - Review console logs for admin notification status
   - Should see "Admin notification sent successfully"

---

## 📊 How It Works

### Flow Diagram

```
1. Customer Completes Booking Payment
   ↓
2. Stripe Sends checkout.session.completed Webhook
   ↓
3. Webhook Handler Processes Event
   ↓
4. Send Customer Confirmation (existing)
   ↓
5. Send Admin Notification (NEW - non-blocking)
   ↓
6. Log Success/Failure
```

### Admin Notification Process

1. **Extract booking data** from Stripe session metadata
2. **Build customer name** from firstName + lastInitial
3. **Get total price** from session amount
4. **Format all data** for WhatsApp template
5. **Send WhatsApp message** to admin phone number
6. **Log result** (success or failure)

**Important:** Admin notification is **non-blocking** - if it fails, the booking still succeeds.

---

## 📝 WhatsApp Template Parameters

### Template: `admin_notify_v3`
### Language: `en_US`

**Parameters (in order):**

| Position | Parameter | Source | Example |
|----------|-----------|--------|---------|
| 1 | `client_name` | `booking.customerName` | "John D" |
| 2 | `service_type` | `booking.serviceType` (formatted) | "Basic Clean" |
| 3 | `payment_amount` | `"$" + booking.totalPrice` | "$120.00" |
| 4 | `service_address` | `booking.address` | "123 Main St, Newark, NJ" |
| 5 | `scheduled_date` | `booking.preferredDate` (YYYY-MM-DD) | "2024-12-26" |

---

## 🔍 Logging & Monitoring

### Console Logs

**Success:**
```
Admin notification sent successfully: {
  messageId: 'wamid.xxx',
  customerName: 'John D',
  serviceType: 'Basic Clean',
  paymentAmount: '$120.00'
}
```

**Warning (Admin phone not set):**
```
ADMIN_WHATSAPP environment variable not set - skipping admin notification
```

**Error:**
```
Admin notification failed: {
  error: 'Invalid phone number format',
  customerName: 'John D'
}
```

### Viewing Logs

**Vercel:**
- Go to Vercel Dashboard → Your Project → Logs
- Filter by function: `webhooks/stripe`

**Stripe:**
- Go to Stripe Dashboard → Webhooks → Your endpoint
- View webhook delivery logs

---

## 🛠️ Troubleshooting

### Issue: Admin notification not being sent

**Check:**
1. ✅ `ADMIN_WHATSAPP` environment variable is set
2. ✅ Phone number is in E.164 format (`+18027335348`)
3. ✅ `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set
4. ✅ WhatsApp template `admin_notify_v3` is approved
5. ✅ Webhook is receiving events (check Stripe dashboard)

**Debug:**
- Use test endpoint to verify WhatsApp credentials work
- Check Stripe webhook delivery logs
- Review console logs for errors
- Verify admin phone number format

### Issue: Invalid phone number

**Check:**
- Phone number must include country code
- Format: `+[country code][number]`
- Examples:
  - ✅ `+18027335348` (US)
  - ✅ `+442071234567` (UK)
  - ❌ `18027335348` (missing +)
  - ❌ `802-733-5348` (wrong format)

### Issue: WhatsApp API errors

**Common Errors:**
- `Invalid phone number` - Check phone format (must be E.164)
- `Template not found` - Verify template name is `admin_notify_v3`
- `Rate limit exceeded` - Wait and retry
- `Invalid access token` - Verify `WHATSAPP_TOKEN` is correct

**Fix:**
- Review error in console logs
- Check WhatsApp Business API documentation
- Verify credentials in Meta Business Manager

### Issue: Admin notification blocking booking

**Solution:**
- Admin notification is **non-blocking** by design
- Uses `.then().catch()` to handle asynchronously
- Errors are logged but don't affect booking flow
- Check logs to see if notification failed

---

## ✅ Verification Checklist

Before going live:

- [ ] `ADMIN_WHATSAPP` set in environment variables (E.164 format)
- [ ] `WHATSAPP_TOKEN` set in environment variables
- [ ] `WHATSAPP_PHONE_NUMBER_ID` set in environment variables
- [ ] WhatsApp template `admin_notify_v3` approved
- [ ] Test endpoint works (`/api/test/send-admin-notification`)
- [ ] Test with real booking and verify admin receives notification
- [ ] Check logs for any errors
- [ ] Verify notification doesn't block booking flow

---

## 📞 Support

If you encounter issues:

1. **Check test endpoint:** `/api/test/send-admin-notification`
2. **Review Stripe webhook logs** in Stripe dashboard
3. **Check Vercel function logs** for errors
4. **Verify environment variables** are set correctly
5. **Test WhatsApp credentials** using test endpoint
6. **Verify admin phone number** is in E.164 format

---

## 📄 Example Logs

### Successful Admin Notification

**Console Output:**
```
Admin notification sent successfully: {
  messageId: 'wamid.HBgNMTgwMjczMzUzNDgA',
  customerName: 'John D',
  serviceType: 'Basic Clean',
  paymentAmount: '$120.00'
}
```

**Test Endpoint Response:**
```json
{
  "success": true,
  "message": "Admin notification sent successfully",
  "messageId": "wamid.HBgNMTgwMjczMzUzNDgA",
  "timestamp": "2024-12-25T12:00:00.000Z"
}
```

### Warning (Admin Phone Not Set)

**Console Output:**
```
ADMIN_WHATSAPP environment variable not set - skipping admin notification
```

### Error Response

**Console Output:**
```
Admin notification failed: {
  error: 'Invalid phone number format',
  customerName: 'John D'
}
```

**Test Endpoint Response:**
```json
{
  "success": false,
  "error": "Invalid phone number format"
}
```

---

## 🔄 Integration with Existing System

The admin notification is integrated into the existing Stripe webhook handler:

1. **Customer confirmation** is sent first (existing)
2. **Admin notification** is sent after (new - non-blocking)
3. Both use the same WhatsApp credentials
4. Both are logged for monitoring
5. Neither blocks the booking flow if they fail

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Deployment




