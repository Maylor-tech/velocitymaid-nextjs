# ⚡ Quick Production Setup Guide

**5-Minute Checklist for Going Live**

---

## 🔴 STEP 1: Vercel Environment Variables (2 minutes)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **4 required variables** for **Production** environment:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
RESEND_API_KEY=re_YOUR_API_KEY
```

**Important:**
- ✅ Use **Production** environment scope
- ✅ `STRIPE_SECRET_KEY` must start with `sk_live_` (NOT `sk_test_`)
- ✅ `NEXT_PUBLIC_BASE_URL` must be your production domain
- ✅ Click "Save" after each variable

---

## 🔴 STEP 2: Stripe Live Mode Setup (3 minutes)

### A. Get Live API Key

1. Go to: https://dashboard.stripe.com
2. **Toggle to Live Mode** (top right)
3. Go to: **Developers → API keys**
4. Copy: **Secret key** (starts with `sk_live_`)
5. Add to Vercel: `STRIPE_SECRET_KEY`

### B. Create Webhook Endpoint

1. In Stripe Dashboard (Live Mode): **Developers → Webhooks**
2. Click: **"+ Add endpoint"**
3. **Endpoint URL:** `https://velocitymaid.com/api/webhooks/stripe`
4. **Events:** Select `checkout.session.completed`
5. Click: **"Add endpoint"**
6. Copy: **Signing secret** (starts with `whsec_`)
7. Add to Vercel: `STRIPE_WEBHOOK_SECRET`

---

## 🔴 STEP 3: Redeploy (1 minute)

1. Go to: **Vercel Dashboard → Deployments**
2. Click: **"..." on latest → "Redeploy"**
3. Wait for deployment to complete
4. Check: Deployment logs for errors

---

## ✅ STEP 4: Test (5 minutes)

1. **Visit:** `https://velocitymaid.com/book`
2. **Complete booking** with real card (small amount: $1-5)
3. **Verify:**
   - ✅ Payment processes in Stripe
   - ✅ Job appears in database
   - ✅ Webhook fires (check Stripe Dashboard)
   - ✅ Customer can access dashboard

---

## 🚨 If Something Goes Wrong

**Quick Rollback:**
1. Change `STRIPE_SECRET_KEY` back to `sk_test_...` in Vercel
2. Redeploy
3. Continue in test mode until fixed

---

## 📋 Full Checklist

For complete details, see: **PRODUCTION_READINESS_CHECKLIST.md**

---

**Ready?** Follow the steps above, then test one real booking. If it works, you're live! 🚀




