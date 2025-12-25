# 🔄 Stripe Live Mode Cutover Plan

**Purpose:** Safely transition from Stripe Test Mode to Live Mode for production launch.

---

## ⚠️ CRITICAL: Read This First

**DO NOT switch to live mode until:**
- ✅ Complete booking flow tested in test mode
- ✅ Webhook endpoint is working
- ✅ All environment variables are set
- ✅ You have tested the full flow end-to-end

---

## 📋 Pre-Cutover Checklist

### 1. Test Mode Verification (Do This First)

- [ ] **Complete test booking:** Use test card `4242 4242 4242 4242`
- [ ] **Verify job creation:** Check database for test job
- [ ] **Verify webhook:** Check Stripe dashboard → Webhooks → Recent deliveries
- [ ] **Verify email:** Magic link email received
- [ ] **Verify dashboard:** Customer can access dashboard
- [ ] **All working?** ✅ Proceed to cutover

### 2. Backup Current Configuration

- [ ] **Save test keys:** Copy test keys to secure location
- [ ] **Document current setup:** Note any custom configurations
- [ ] **Database backup:** Ensure database is backed up

---

## 🔄 Cutover Steps (Do in Order)

### STEP 1: Update Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - Navigate to: Your Project → Settings → Environment Variables

2. **Update Stripe Secret Key:**
   - Find: `STRIPE_SECRET_KEY`
   - **Current:** `sk_test_...` (test key)
   - **New:** `sk_live_...` (live key from Stripe Dashboard)
   - **Environment:** Production only (or Preview if testing)
   - Click: "Save"

3. **Update Webhook Secret:**
   - Find: `STRIPE_WEBHOOK_SECRET`
   - **New:** Get from Stripe Dashboard → Webhooks → Your endpoint → Signing secret
   - **Environment:** Production only
   - Click: "Save"

4. **Verify Base URL:**
   - Find: `NEXT_PUBLIC_BASE_URL`
   - **Must be:** `https://velocitymaid.com` (or your production domain)
   - **NOT:** `http://localhost:3000`
   - Click: "Save" if needed

### STEP 2: Create Live Mode Webhook Endpoint

1. **Go to Stripe Dashboard (LIVE MODE):**
   - Toggle to **Live Mode** (top right)
   - Navigate to: Developers → Webhooks

2. **Add Endpoint:**
   - Click: "+ Add endpoint"
   - **Endpoint URL:** `https://velocitymaid.com/api/webhooks/stripe`
   - **Description:** "Production webhook for booking confirmations"
   - **Events to send:**
     - ✅ `checkout.session.completed`
     - ✅ `payment_intent.succeeded`
     - (Optional) `charge.refunded`
   - Click: "Add endpoint"

3. **Copy Signing Secret:**
   - Click on the new endpoint
   - Copy: **Signing secret** (starts with `whsec_`)
   - Add to Vercel: `STRIPE_WEBHOOK_SECRET`

### STEP 3: Redeploy Application

1. **Trigger Redeploy:**
   - Go to: Vercel Dashboard → Deployments
   - Click: "..." on latest deployment → "Redeploy"
   - **OR:** Push a commit to trigger auto-deploy

2. **Verify Deployment:**
   - Wait for deployment to complete
   - Check: Deployment logs for errors
   - Verify: Environment variables are loaded

### STEP 4: Test Live Mode (Small Amount)

1. **Make Test Booking:**
   - Visit: `https://velocitymaid.com/book`
   - Complete booking form
   - Use **real credit card** with **small amount** ($1-5)
   - Complete payment

2. **Verify Results:**
   - [ ] Payment shows in Stripe Dashboard (Live Mode)
   - [ ] Job created in database with `paymentStatus: PAID`
   - [ ] Webhook received (check Stripe Dashboard → Webhooks → Recent deliveries)
   - [ ] Email sent (if magic link requested)
   - [ ] Customer dashboard shows job

3. **If Everything Works:**
   - ✅ **You're live!**
   - Monitor first few real bookings closely

---

## 🚨 Rollback Plan (If Something Goes Wrong)

### Quick Rollback Steps

1. **Revert Environment Variables:**
   - Go to: Vercel Dashboard → Settings → Environment Variables
   - Change `STRIPE_SECRET_KEY` back to `sk_test_...`
   - Change `STRIPE_WEBHOOK_SECRET` back to test webhook secret
   - Redeploy

2. **Disable Live Webhook:**
   - Go to: Stripe Dashboard (Live Mode) → Webhooks
   - Disable the production webhook endpoint

3. **Switch Back to Test Mode:**
   - Continue using test mode until issues are resolved

---

## ✅ Post-Cutover Verification

### Daily Checks (First Week)

- [ ] **Monitor Stripe Dashboard:** Check for failed payments
- [ ] **Check Webhook Logs:** Verify all events are processed
- [ ] **Database Checks:** Verify jobs are being created
- [ ] **Customer Support:** Monitor for customer issues
- [ ] **Error Logs:** Check Vercel logs for errors

### Weekly Checks (Ongoing)

- [ ] **Payment Reconciliation:** Verify Stripe payments match database
- [ ] **Webhook Health:** Check webhook success rate
- [ ] **Performance:** Monitor page load times
- [ ] **Customer Feedback:** Gather feedback from real customers

---

## 📞 Support Contacts

- **Stripe Support:** https://support.stripe.com
- **Vercel Support:** https://vercel.com/support
- **Emergency:** Have Stripe support phone number ready

---

## 🎯 Success Criteria

**Cutover is successful when:**

- ✅ Live payments are processing correctly
- ✅ Jobs are being created in database
- ✅ Webhooks are firing and processing
- ✅ Customers can access their dashboards
- ✅ No critical errors in logs
- ✅ Support team can access customer data

---

**Last Updated:** January 2025  
**Status:** Ready for execution


