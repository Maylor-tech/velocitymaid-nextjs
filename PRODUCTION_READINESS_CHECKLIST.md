# 🚀 Production Readiness Checklist

**Date:** January 2025  
**Status:** Pre-Launch Verification

---

## ✅ PHASE 1: Environment Variables (CRITICAL)

### Required Variables (Must Have)

#### 1. Database Connection
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require
```
- [ ] **Vercel Production:** Set in Vercel Dashboard → Settings → Environment Variables
- [ ] **Verify:** Connection string uses SSL (`sslmode=require`)
- [ ] **Test:** Run `npx prisma db pull` to verify connection

#### 2. Stripe Payment Processing
```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```
- [ ] **Stripe Dashboard:** Switch to **Live Mode** (toggle in top right)
- [ ] **Get Live Secret Key:** https://dashboard.stripe.com/apikeys (Live mode)
- [ ] **Get Webhook Secret:** https://dashboard.stripe.com/webhooks → Your endpoint → Signing secret
- [ ] **Vercel Production:** Add both variables
- [ ] **Verify:** Key starts with `sk_live_` (NOT `sk_test_`)

#### 3. Base URL (Redirects & Links)
```env
NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
```
- [ ] **Vercel Production:** Set to your production domain
- [ ] **Verify:** Must start with `https://`
- [ ] **Test:** Visit `https://velocitymaid.com` and verify it loads

#### 4. Email Delivery (Resend)
```env
RESEND_API_KEY=re_YOUR_API_KEY
RESEND_FROM_EMAIL=VelocityMaid <noreply@velocitymaid.com>
```
- [ ] **Resend Dashboard:** https://resend.com/api-keys → Create API key
- [ ] **Domain Setup:** Verify domain in Resend (if using custom domain)
- [ ] **Vercel Production:** Add both variables
- [ ] **Test:** Send test email from magic link endpoint

### Optional Variables (Recommended)

#### 5. Cron Jobs Security
```env
CRON_SECRET=your-random-secret-string-here
```
- [ ] **Generate:** `openssl rand -hex 32` or use password generator
- [ ] **Vercel Production:** Add variable
- [ ] **Purpose:** Protects `/api/cron/*` endpoints

#### 6. Google Analytics
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
- [ ] **GA4 Dashboard:** Get Measurement ID
- [ ] **Vercel Production:** Add variable
- [ ] **Verify:** Check `app/layout.tsx` uses this variable

---

## ✅ PHASE 2: Stripe Configuration (CRITICAL)

### Webhook Endpoint Setup

1. **Create Webhook Endpoint in Stripe:**
   - [ ] Go to: https://dashboard.stripe.com/webhooks (Live Mode)
   - [ ] Click: "+ Add endpoint"
   - [ ] Endpoint URL: `https://velocitymaid.com/api/webhooks/stripe`
   - [ ] Events to send:
     - [ ] `checkout.session.completed` ✅ (REQUIRED)
     - [ ] `payment_intent.succeeded` ✅ (RECOMMENDED)
     - [ ] `charge.refunded` (Optional)
   - [ ] Click: "Add endpoint"
   - [ ] Copy: **Signing secret** → Add to `STRIPE_WEBHOOK_SECRET`

2. **Verify Webhook is Active:**
   - [ ] Status shows: **200 OK** on recent deliveries
   - [ ] Test webhook: Use Stripe CLI or test payment
   - [ ] Check logs: Verify webhook receives events

### Stripe Test Mode → Live Mode Checklist

- [ ] **Switch to Live Mode:** Toggle in Stripe Dashboard
- [ ] **Update API Keys:** Use `sk_live_...` keys
- [ ] **Update Webhook:** Point to production URL
- [ ] **Test Payment:** Use real card (small amount) to verify
- [ ] **Verify Job Creation:** Check database after test payment

---

## ✅ PHASE 3: Database Verification

### Prisma Schema Sync

- [ ] **Run Migration:** `npx prisma migrate deploy` (production)
- [ ] **Verify Tables:** Check all tables exist:
  - [ ] `Customer`
  - [ ] `Job`
  - [ ] `Branch`
  - [ ] `MagicLoginToken`
  - [ ] `BranchServiceArea`
- [ ] **Check Indexes:** Verify indexes are created
- [ ] **Test Connection:** Run `npx prisma studio` (if possible) or test query

### Data Integrity Checks

- [ ] **Branches Seeded:** Verify all 4 branches exist (NJ, VT, Miami, Jamaica)
- [ ] **Service Areas:** Verify ZIP codes are mapped correctly
- [ ] **No Orphaned Data:** Check for any data inconsistencies

---

## ✅ PHASE 4: Email Delivery Verification

### Resend Configuration

- [ ] **API Key Created:** In Resend dashboard
- [ ] **Domain Verified:** (If using custom domain)
- [ ] **From Address:** Set to `noreply@velocitymaid.com` or verified domain
- [ ] **Test Email:** Send test magic link email
- [ ] **Verify Delivery:** Check inbox (and spam folder)

### Email Templates

- [ ] **Magic Link Email:** Test sending and receiving
- [ ] **Booking Confirmation:** (If implemented)
- [ ] **Admin Notifications:** (If implemented)

---

## ✅ PHASE 5: End-to-End Testing

### Complete Booking Flow Test

1. **Start Booking:**
   - [ ] Visit: `https://velocitymaid.com/book`
   - [ ] Select location (New Jersey, Vermont, Miami, or Jamaica)
   - [ ] Select service type
   - [ ] Fill home details
   - [ ] Select date & time
   - [ ] Add extras (optional)
   - [ ] Enter contact info

2. **Payment Test:**
   - [ ] Click "Confirm Booking"
   - [ ] Redirected to Stripe Checkout
   - [ ] Use **real test card:** `4242 4242 4242 4242`
   - [ ] Complete payment
   - [ ] Redirected to confirmation page

3. **Verify Backend:**
   - [ ] Check database: Job record created with `paymentStatus: PAID`
   - [ ] Check Stripe: Payment shows as completed
   - [ ] Check webhook: Event received and processed
   - [ ] Check email: Magic link sent (if requested)

4. **Customer Dashboard:**
   - [ ] Request magic link
   - [ ] Click link from email
   - [ ] Logged into dashboard
   - [ ] Job appears in "Upcoming" tab
   - [ ] Job details are correct

### Edge Cases to Test

- [ ] **Duplicate Payment:** Try to create same job twice (should be idempotent)
- [ ] **Webhook Retry:** Manually retry webhook (should not create duplicate)
- [ ] **Invalid Session:** Try to access `/book/confirmation` without session_id
- [ ] **Expired Magic Link:** Wait 15+ minutes, try to use link
- [ ] **Rate Limiting:** Send 10+ magic link requests (should rate limit)

---

## ✅ PHASE 6: Security & Performance

### Security Checks

- [ ] **HTTPS:** All pages load over HTTPS
- [ ] **Environment Variables:** No secrets exposed in client-side code
- [ ] **Webhook Signature:** Stripe webhook signature verification working
- [ ] **Rate Limiting:** Magic link endpoint has rate limiting
- [ ] **SQL Injection:** Using Prisma (parameterized queries)
- [ ] **XSS Protection:** Input sanitization in place

### Performance Checks

- [ ] **Page Load:** Homepage loads in < 3 seconds
- [ ] **Image Optimization:** Images use Next.js Image component
- [ ] **Lazy Loading:** Below-fold content lazy loads
- [ ] **Bundle Size:** Check bundle size is reasonable
- [ ] **Lighthouse Score:** Run Lighthouse audit (aim for 90+)

---

## ✅ PHASE 7: Monitoring & Analytics

### Error Tracking

- [ ] **Console Errors:** No errors in browser console
- [ ] **Server Logs:** Check Vercel logs for errors
- [ ] **Stripe Logs:** Check Stripe dashboard for failed payments
- [ ] **Database Logs:** Check for connection errors

### Analytics Setup

- [ ] **Google Analytics:** Tracking code installed
- [ ] **Conversion Tracking:** Track booking completions
- [ ] **Event Tracking:** Track key user actions

---

## ✅ PHASE 8: Final Pre-Launch Verification

### Production URL Checklist

- [ ] **Homepage:** `https://velocitymaid.com` loads correctly
- [ ] **Booking:** `https://velocitymaid.com/book` works
- [ ] **Customer Portal:** `https://velocitymaid.com/customer/jobs` requires auth
- [ ] **Magic Link:** Email links point to production URL
- [ ] **Stripe Redirects:** Success URL points to production

### Communication Channels

- [ ] **Phone:** `(973) 280-9190` is active and monitored
- [ ] **WhatsApp:** Number is active and monitored
- [ ] **Email:** `hello@velocitymaid.com` is monitored
- [ ] **Support:** Support process is documented

---

## 🚨 CRITICAL: Before Going Live

### Final Verification Steps

1. **Test Complete Flow with Real Payment:**
   - [ ] Use real credit card (small amount)
   - [ ] Verify payment processes
   - [ ] Verify job is created
   - [ ] Verify customer can access dashboard
   - [ ] Verify webhook fires correctly

2. **Backup & Rollback Plan:**
   - [ ] Database backup configured
   - [ ] Know how to rollback if needed
   - [ ] Have Stripe test mode ready to switch back

3. **Team Readiness:**
   - [ ] Support team knows how to access customer data
   - [ ] Admin dashboard is accessible
   - [ ] Process for handling issues is documented

---

## 📋 Quick Verification Script

Run these commands to verify setup:

```bash
# 1. Check environment variables (local)
echo "Checking local env vars..."
[ -f .env.local ] && echo "✅ .env.local exists" || echo "❌ .env.local missing"

# 2. Verify Stripe key format
grep STRIPE_SECRET_KEY .env.local | grep -q "sk_live_" && echo "✅ Using LIVE key" || echo "⚠️  Check if using test key"

# 3. Check database connection
npx prisma db pull && echo "✅ Database connected" || echo "❌ Database connection failed"

# 4. Build check
npm run build && echo "✅ Build successful" || echo "❌ Build failed"
```

---

## 🎯 Success Criteria

**You're ready to go live when:**

- ✅ All required environment variables are set in Vercel
- ✅ Stripe is in Live Mode with production keys
- ✅ Webhook endpoint is active and receiving events
- ✅ Complete booking flow tested end-to-end
- ✅ Email delivery is working
- ✅ Customer dashboard is accessible
- ✅ No critical errors in logs
- ✅ Performance is acceptable

---

## 📞 Support Resources

- **Stripe Support:** https://support.stripe.com
- **Vercel Support:** https://vercel.com/support
- **Resend Support:** https://resend.com/support
- **Prisma Docs:** https://www.prisma.io/docs

---

**Last Updated:** January 2025  
**Next Review:** After first production booking



