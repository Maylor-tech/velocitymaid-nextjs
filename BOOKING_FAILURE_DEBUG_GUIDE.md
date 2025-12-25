# 🔍 Booking Failure Debug Guide

**Error:** "Unexpected end of JSON input"  
**Location:** `/book/confirmation` page after Stripe payment

---

## 🐛 Root Cause Analysis

The error "Unexpected end of JSON input" means:
- The API response body is **empty** or **incomplete**
- The API is returning **HTML** instead of JSON (like an error page)
- The API is **crashing** before it can send a response

---

## ✅ Fixes Applied

### 1. Improved Error Handling in Confirmation Page
**File:** `app/book/confirmation/page.tsx`

**Changes:**
- ✅ Check response content-type before parsing JSON
- ✅ Handle empty responses gracefully
- ✅ Better error messages for different failure types
- ✅ Validate response text before parsing

### 2. Enhanced Logging in Booking Create API
**File:** `app/api/booking/create/route.ts`

**Changes:**
- ✅ Added logging for metadata parsing
- ✅ Log which metadata format is being used
- ✅ Log extracted booking data structure
- ✅ Better error context in logs

---

## 🔍 How to Debug

### Step 1: Check Server Logs
When the booking fails, check your server console for:
```
[BOOKING CREATE] Stripe metadata keys: [...]
[BOOKING CREATE] Has bookingDataMin: true/false
[BOOKING CREATE] Parsed minimized data successfully
[BOOKING CREATE] Extracted booking data: {...}
```

### Step 2: Check Browser Network Tab
1. Open DevTools → Network tab
2. Look for the request to `/api/booking/create?session_id=...`
3. Check:
   - **Status Code** (should be 200, not 500)
   - **Response Headers** (should have `content-type: application/json`)
   - **Response Body** (should be JSON, not empty)

### Step 3: Common Issues

#### Issue A: Missing Metadata
**Symptom:** `Has bookingDataMin: false` and `Has contactFull: false`
**Cause:** Stripe metadata wasn't saved correctly
**Fix:** Check `/api/checkout` route to ensure metadata is being set

#### Issue B: Database Error
**Symptom:** Error in server logs about Prisma/database
**Cause:** Database connection issue or schema mismatch
**Fix:** Check database connection and Prisma schema

#### Issue C: Missing Email
**Symptom:** `Missing customer email` error
**Cause:** Contact email not in metadata
**Fix:** Ensure email is included in Stripe metadata

---

## 🧪 Test Steps

### Step 1: Test with Real Stripe Session
1. Go to: `http://localhost:3000/book?branch=miami`
2. Complete booking form
3. Complete Stripe payment (use test card)
4. Check server logs for metadata parsing
5. Check browser network tab for API response

### Step 2: Verify Metadata
After payment, the Stripe session should have:
- `bookingDataMin` OR individual fields (`contactFull`, `serviceType`, etc.)
- `branchSlug`
- Customer email in `customer_email` or metadata

---

## 📝 Expected Flow

1. ✅ Customer completes Stripe payment
2. ✅ Stripe redirects to `/book/confirmation?session_id=cs_test_...`
3. ✅ Confirmation page calls `/api/booking/create?session_id=...`
4. ✅ API retrieves Stripe session
5. ✅ API verifies `payment_status === 'paid'`
6. ✅ API extracts booking data from metadata
7. ✅ API creates customer and job
8. ✅ API returns JSON: `{ success: true, jobId, customerId, message }`
9. ✅ Confirmation page shows success
10. ✅ Redirects to `/customer/jobs`

---

## 🚨 If Still Failing

Check these in order:

1. **Server logs** - Look for error messages
2. **Network tab** - Check actual API response
3. **Stripe dashboard** - Verify session exists and is paid
4. **Database** - Check if customer/job tables are accessible
5. **Environment variables** - Ensure `STRIPE_SECRET_KEY` is set

---

**Last Updated:** December 28, 2024








