# 🔴 STRIPE LIVE CUTOVER - Step-by-Step Guide

**Time Required:** 15-20 minutes  
**Risk Level:** Low (reversible)  
**Status:** Ready to execute

---

## ⚠️ PRE-FLIGHT CHECKLIST

Before starting, confirm:

- [ ] You have a Stripe account (if not: https://stripe.com)
- [ ] You've completed Stripe account verification (business details, bank account)
- [ ] You have access to your Vercel dashboard
- [ ] You have your production domain ready (or Vercel URL)

---

## 📋 STEP 1: Get Your Stripe LIVE Keys (5 minutes)

### 1.1 Log into Stripe Dashboard

1. Go to: **https://dashboard.stripe.com**
2. **Toggle to LIVE MODE** (switch in top-right corner)
   - Should say **"Live mode"** when active
   - Background should be **white/light** (not purple)

### 1.2 Get Your Secret Key

1. Navigate to: **Developers** → **API keys**
2. Find **"Secret key"** (starts with `sk_live_...`)
3. Click **"Reveal live key"**
4. **Copy the entire key** - it looks like: `sk_live_51AbC123xYz789...`
5. **Save it securely** (password manager, notes app)

⚠️ **CRITICAL:** 
- ✅ Must start with `sk_live_` (NOT `pk_live_`)
- ✅ This is your **SECRET** key - never share publicly
- ✅ You'll only see it once - copy it now

### 1.3 Get Your Webhook Secret (Optional but Recommended)

1. Still in **Developers** → **API keys**
2. Scroll down to **"Webhooks"** section
3. Click **"Add endpoint"** (if you haven't already)
4. Set endpoint URL to: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Replace `your-domain.vercel.app` with your actual Vercel URL
5. Select events: **`checkout.session.completed`**
6. Click **"Add endpoint"**
7. Click on the endpoint you just created
8. Find **"Signing secret"** (starts with `whsec_...`)
9. Click **"Reveal"** and copy it

---

## 📋 STEP 2: Add Keys to Vercel (5 minutes)

### 2.1 Navigate to Vercel Environment Variables

1. Go to: **https://vercel.com/dashboard**
2. Select your **velocitymaid-nextjs** project
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### 2.2 Add STRIPE_SECRET_KEY

1. Click **"Add New"**
2. **Name:** `STRIPE_SECRET_KEY`
3. **Value:** Paste your `sk_live_...` key from Step 1.2
4. **Environment:** Select **Production** (and optionally Preview/Development)
5. Click **"Save"**

### 2.3 Add STRIPE_WEBHOOK_SECRET (If you got it)

1. Click **"Add New"** again
2. **Name:** `STRIPE_WEBHOOK_SECRET`
3. **Value:** Paste your `whsec_...` secret from Step 1.3
4. **Environment:** Select **Production**
5. Click **"Save"**

### 2.4 Verify NEXT_PUBLIC_BASE_URL

1. Check if `NEXT_PUBLIC_BASE_URL` exists
2. If not, add it:
   - **Name:** `NEXT_PUBLIC_BASE_URL`
   - **Value:** `https://your-domain.vercel.app` (your production URL)
   - **Environment:** Production
3. If it exists, verify it's correct

---

## 📋 STEP 3: Redeploy to Production (2 minutes)

### 3.1 Trigger Redeploy

**Option A: Via Git Push (Recommended)**
```bash
git commit --allow-empty -m "Trigger production redeploy with Stripe LIVE keys"
git push origin main
```

**Option B: Via Vercel Dashboard**
1. Go to your project in Vercel
2. Click **"Deployments"** tab
3. Find your latest deployment
4. Click **"..."** menu → **"Redeploy"**
5. Select **"Use existing Build Cache"** = OFF (to ensure fresh build)
6. Click **"Redeploy"**

### 3.2 Wait for Deployment

- Watch the deployment logs
- Should complete in 2-3 minutes
- Look for: **"✓ Build Completed"**

---

## 📋 STEP 4: Verify Keys Are Active (3 minutes)

### 4.1 Check Environment Variables in Build Logs

1. In Vercel, go to your deployment
2. Click **"Build Logs"**
3. Look for any errors about `STRIPE_SECRET_KEY`
4. Should see: **"✓ Compiled successfully"**

### 4.2 Test Checkout Flow (Dry Run)

1. Visit your production site: `https://your-domain.vercel.app/book`
2. Fill out the booking form
3. Click **"Continue to Secure Payment"**
4. **You should be redirected to Stripe Checkout**
5. **DO NOT complete payment yet** - just verify it loads

**Expected:**
- ✅ Stripe Checkout page loads
- ✅ Shows your business name
- ✅ Shows correct amount
- ✅ No error messages

**If Error:**
- Check Vercel environment variables are set correctly
- Check deployment completed successfully
- Check browser console for errors

---

## 📋 STEP 5: Make Your First Real Payment (5 minutes)

### 5.1 Complete a Test Booking

1. **Use a REAL credit card** (your own, or test with small amount)
2. Complete the booking form
3. Click **"Continue to Secure Payment"**
4. On Stripe Checkout:
   - Enter real card details
   - Complete payment
5. **You should be redirected to:** `/book/confirmation`

### 5.2 Verify Payment in Stripe Dashboard

1. Go to: **https://dashboard.stripe.com** (LIVE mode)
2. Click **"Payments"** in left sidebar
3. **You should see your payment:**
   - Status: **"Succeeded"**
   - Amount: Correct
   - Customer email: Matches booking

### 5.3 Verify Job Created in Database

1. Go to your production site: `/customer/dashboard`
2. **You should see:**
   - Your booking listed
   - Status: **"Upcoming"** or **"Confirmed"**
   - Payment status: **"Paid"**

**If job doesn't appear:**
- Check Stripe webhook is configured (Step 1.3)
- Check `STRIPE_WEBHOOK_SECRET` is set in Vercel
- Check Vercel function logs for webhook errors

---

## 📋 STEP 6: Final Verification (2 minutes)

### 6.1 Check Stripe Dashboard

- [ ] Payment appears in **Payments** tab
- [ ] Customer appears in **Customers** tab
- [ ] No errors in **Developers** → **Logs**

### 6.2 Check Your Application

- [ ] Booking confirmation page loads
- [ ] Customer dashboard shows the job
- [ ] Job has correct details (date, time, address)
- [ ] Payment status is "Paid"

### 6.3 Test Magic Link Login

1. Go to: `/customer/login`
2. Enter the email you used for booking
3. Check email for magic link
4. Click magic link
5. **Should redirect to dashboard** showing your booking

---

## ✅ SUCCESS CRITERIA

You're **LIVE** when:

- ✅ Stripe Checkout loads in production
- ✅ Real payment processes successfully
- ✅ Job appears in customer dashboard
- ✅ Payment shows as "Paid" in Stripe
- ✅ Magic link login works

---

## 🚨 TROUBLESHOOTING

### Error: "STRIPE_SECRET_KEY is missing"

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Verify `STRIPE_SECRET_KEY` exists
3. Verify it's set for **Production** environment
4. Redeploy

### Error: "Use Stripe SECRET key (sk_...), not pk_"

**Fix:**
- You accidentally used publishable key
- Get secret key from Stripe Dashboard (starts with `sk_live_`)
- Update in Vercel environment variables

### Payment Succeeds But Job Not Created

**Fix:**
1. Check webhook is configured (Step 1.3)
2. Check `STRIPE_WEBHOOK_SECRET` in Vercel
3. Check Vercel function logs: **Deployments** → **Functions** → **View Logs**
4. Look for webhook errors

### Stripe Checkout Shows Test Mode

**Fix:**
- You're still using test keys
- Verify you copied `sk_live_...` (not `sk_test_...`)
- Verify Vercel has LIVE key set
- Redeploy

---

## 🔄 ROLLBACK PLAN (If Needed)

If something goes wrong:

1. **Revert to Test Keys:**
   - In Vercel, change `STRIPE_SECRET_KEY` back to `sk_test_...`
   - Redeploy

2. **No Data Loss:**
   - All payments in Stripe are safe
   - Database records remain
   - Just switch keys back

---

## 📞 NEXT STEPS AFTER CUTOVER

Once LIVE:

1. **Monitor first 10 payments** closely
2. **Set up Stripe email notifications** (Dashboard → Settings → Notifications)
3. **Review webhook logs** daily for first week
4. **Test refund flow** (if needed)
5. **Celebrate! 🎄**

---

**You've got this. Follow each step, verify as you go, and you'll be live in 20 minutes.**


