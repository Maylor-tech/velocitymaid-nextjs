# ⚡ Stripe LIVE Cutover - Quick Checklist

**Print this or keep it open while you execute the cutover**

---

## 🔑 STEP 1: Get Stripe LIVE Keys

- [ ] Go to https://dashboard.stripe.com
- [ ] Toggle to **LIVE MODE** (top-right switch)
- [ ] Go to **Developers** → **API keys**
- [ ] Copy **Secret key** (`sk_live_...`)
- [ ] (Optional) Set up webhook endpoint
- [ ] (Optional) Copy **Webhook secret** (`whsec_...`)

---

## 🌐 STEP 2: Add to Vercel

- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Add `STRIPE_SECRET_KEY` = `sk_live_...` (Production)
- [ ] (Optional) Add `STRIPE_WEBHOOK_SECRET` = `whsec_...` (Production)
- [ ] Verify `NEXT_PUBLIC_BASE_URL` is set correctly

---

## 🚀 STEP 3: Redeploy

- [ ] Push empty commit OR click "Redeploy" in Vercel
- [ ] Wait for deployment to complete (2-3 min)
- [ ] Check build logs for errors

---

## ✅ STEP 4: Test

- [ ] Visit `/book` on production site
- [ ] Fill form → Click "Continue to Payment"
- [ ] **Verify Stripe Checkout loads** (don't pay yet)
- [ ] Complete one real payment
- [ ] Check Stripe Dashboard → Payments (should see payment)
- [ ] Check `/customer/dashboard` (should see job)

---

## 🎯 SUCCESS = LIVE!

- [ ] Payment processes
- [ ] Job appears in dashboard
- [ ] Payment shows in Stripe
- [ ] Magic link login works

---

**Time: ~20 minutes | Risk: Low | You've got this! 🎄**

