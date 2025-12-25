# 🔍 Environment Variables Verification Checklist

**Date:** Today  
**Purpose:** Verify all critical environment variables are set in Vercel

---

## ✅ CRITICAL Variables (Must Have for Production)

### 1. **Stripe Payment Processing** 🔴
```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
```

**Status Check:**
- [ ] `STRIPE_SECRET_KEY` exists and starts with `sk_live_` (NOT `sk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` exists and starts with `whsec_`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists and starts with `pk_live_` ✅ (You have this!)

**Where to get:**
- Stripe Dashboard → **Live Mode** (toggle top right)
- Developers → API keys → Copy Secret key
- Developers → Webhooks → Your endpoint → Copy Signing secret

---

### 2. **Database Connection** 🔴
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require
```

**Status Check:**
- [ ] `DATABASE_URL` exists
- [ ] Contains `sslmode=require` (required for Supabase)
- [ ] Uses production database (not localhost)

**Where to get:**
- Supabase Dashboard → Project Settings → Database → Connection String
- Use "Connection Pooling" URL for production

---

### 3. **Base URL (Redirects & Links)** 🔴
```env
NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
```

**Status Check:**
- [ ] `NEXT_PUBLIC_BASE_URL` exists
- [ ] Set to `https://velocitymaid.com` (or your production domain)
- [ ] Does NOT contain `localhost` or `127.0.0.1`

---

### 4. **Email Service (Resend)** 🔴
```env
RESEND_API_KEY=re_YOUR_API_KEY
RESEND_FROM_EMAIL=VelocityMaid <noreply@velocitymaid.com>
```

**Status Check:**
- [ ] `RESEND_API_KEY` exists and starts with `re_`
- [ ] `RESEND_FROM_EMAIL` exists (optional but recommended)

**Where to get:**
- Resend Dashboard → API Keys → Create API key

---

## 📋 Optional Variables (Nice to Have)

### 5. **Cron Jobs Security**
```env
CRON_SECRET=your-random-secret-string-here
```
- [ ] Set if using cron jobs (protects endpoints)

### 6. **Google Analytics** (You have this!)
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
- [x] You have this set ✅

### 7. **Zapier Integration** (You have this!)
```env
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/...
```
- [x] You have this set ✅

---

## 🚨 Variables You Showed (Need Clarification)

These look unusual - please verify:
- `Critical` - What is this variable for?
- `Target` - What is this variable for?
- `Impact` - What is this variable for?
- `Time` - What is this variable for?
- `Working` - What is this variable for?

These don't appear to be standard Next.js/Stripe environment variables. They might be:
- Custom variables for your application
- Test variables that can be removed
- Variables from a different system

---

## ✅ Quick Verification Steps

### In Vercel Dashboard:

1. **Go to:** Your Project → Settings → Environment Variables
2. **Filter by:** Production environment
3. **Check for these exact names:**
   - ✅ `STRIPE_SECRET_KEY` (must be `sk_live_...`)
   - ✅ `STRIPE_WEBHOOK_SECRET` (must be `whsec_...`)
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (you have this ✅)
   - ✅ `DATABASE_URL` (must be production database)
   - ✅ `NEXT_PUBLIC_BASE_URL` (must be `https://velocitymaid.com`)
   - ✅ `RESEND_API_KEY` (must be `re_...`)

### If Any Are Missing:

1. **Add them** in Vercel Dashboard
2. **Redeploy** after adding (environment variables only load on deployment)
3. **Test** by visiting your production site

---

## 🎯 Most Critical Check

**Before going live, verify:**
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (NOT `sk_test_`)
- [ ] `NEXT_PUBLIC_BASE_URL` = `https://velocitymaid.com` (NOT `localhost`)

These two are the most critical - if wrong, payments won't work or redirects will break!

---

## 📝 Next Steps

1. **Verify** all critical variables are set
2. **Check** that Stripe keys are LIVE (not test)
3. **Redeploy** if you added/updated any variables
4. **Test** one booking on production

---

**Need Help?** If any variables are missing or you're unsure about values, let me know!

