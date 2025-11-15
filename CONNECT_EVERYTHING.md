# 🔗 Complete Connection Guide - Connect Everything

This guide will help you connect all the pieces: GitHub → Vercel → Stripe → Zapier → Google Analytics

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub repository: `Maylor-tech/velocitymaid-nextjs`
- [ ] Vercel account (already deployed)
- [ ] Stripe account (test and live keys)
- [ ] Zapier account (with Zaps created)
- [ ] Google Analytics 4 property (with Measurement ID)

---

## 1️⃣ Connect GitHub to Vercel (Auto-Deploy)

### If Already Connected:
✅ Your site auto-deploys when you push to GitHub

### If NOT Connected:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click your project: `velocitymaid-nextjs`

2. **Connect GitHub:**
   - Go to: **Settings** → **Git**
   - Click **"Connect Git Repository"**
   - Select: `Maylor-tech/velocitymaid-nextjs`
   - Choose branch: `main`
   - Click **"Connect"**

3. **Verify Auto-Deploy:**
   - Make a small change in your code
   - Push to GitHub: `git push`
   - Check Vercel → Deployments tab
   - Should see new deployment automatically

---

## 2️⃣ Set Up Environment Variables in Vercel

**CRITICAL:** These must be set for Stripe and other features to work!

### Step 1: Go to Vercel Environment Variables

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

### Step 2: Add These Variables

#### Variable 1: Stripe Secret Key

**For Production (Live Site):**
- **Name:** `STRIPE_SECRET_KEY`
- **Value:** `sk_live_YOUR_ACTUAL_LIVE_KEY` (from Stripe Dashboard → Live Mode)
- **Environments:** ✅ Production ✅ Preview ✅ Development

**For Testing (Development):**
- **Name:** `STRIPE_SECRET_KEY`
- **Value:** `sk_test_YOUR_ACTUAL_TEST_KEY` (from Stripe Dashboard → Test Mode)
- **Environments:** ✅ Development (only)

#### Variable 2: Base URL

- **Name:** `NEXT_PUBLIC_BASE_URL`
- **Value:** `https://velocitymaid.com` (or `https://www.velocitymaid.com`)
- **Environments:** ✅ Production ✅ Preview ✅ Development

### Step 3: Save and Redeploy

1. Click **"Save"** after adding each variable
2. Go to **Deployments** tab
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**
5. Wait for deployment to complete

### Step 4: Verify

1. Visit: `https://velocitymaid.com/booking`
2. Fill out form and test checkout
3. Check Stripe Dashboard → Payments (should see test payment)

---

## 3️⃣ Update Google Analytics ID

### Step 1: Get Your GA4 Measurement ID

1. Go to: https://analytics.google.com
2. Select your property
3. Go to: **Admin** (gear icon) → **Data Streams**
4. Click your web stream
5. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 2: Update in Code

1. **Open:** `app/layout.tsx`
2. **Find line 121:** `<GoogleAnalytics gaId="G-XXXXXXXXXX" />`
3. **Replace** `G-XXXXXXXXXX` with your actual Measurement ID
4. **Save the file**

### Step 3: Deploy

```bash
git add app/layout.tsx
git commit -m "Update Google Analytics ID"
git push
```

Vercel will auto-deploy. Wait 1-2 minutes, then:

### Step 4: Verify GA4 is Working

1. Visit your site: `https://velocitymaid.com`
2. Go to Google Analytics → **Reports** → **Realtime**
3. You should see yourself as an active user
4. Test events:
   - Click phone number → Check GA4 → Events → `phone_clicked`
   - Click WhatsApp → Check GA4 → Events → `whatsapp_clicked`
   - Visit `/booking` → Check GA4 → Events → `booking_started`

---

## 4️⃣ Connect Zapier for Booking Notifications

### Option A: Stripe Webhook (Recommended)

When a customer completes payment, Stripe sends a webhook to Zapier.

#### Step 1: Create Zap in Zapier

1. **Go to:** https://zapier.com/app/zaps
2. **Click:** "+ Create Zap"
3. **Trigger:** Search for "Stripe"
4. **Event:** "New Payment" or "Payment Succeeded"
5. **Connect Account:** Connect your Stripe account
6. **Test:** Click "Test trigger" to see sample data

#### Step 2: Add Action

**Option 1: Send Email**
1. **Action:** Search for "Email"
2. **App:** "Email by Zapier" or "Gmail"
3. **Action:** "Send Outbound Email"
4. **Configure:**
   - **To:** Your email (e.g., `hello@velocitymaid.com`)
   - **Subject:** `New Booking: {{customer_email}}`
   - **Body:** 
     ```
     New booking received!
     
     Customer: {{customer_email}}
     Amount: ${{amount}}
     Service: {{service_type}}
     Date: {{preferred_date}}
     ```
5. **Test:** Click "Test action"

**Option 2: Send SMS**
1. **Action:** Search for "SMS" or "Twilio"
2. **Configure:** Similar to email above

#### Step 3: Turn On Zap

1. Click **"Turn on Zap"** (top right)
2. Zap is now active!

#### Step 4: Get Webhook URL from Zapier

1. In your Zap, go to **Trigger** step
2. Look for **"Webhook URL"** or **"Webhook"** option
3. Copy the webhook URL (looks like: `https://hooks.zapier.com/hooks/catch/...`)

#### Step 5: Add Webhook to Stripe

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Click:** "+ Add endpoint"
3. **Endpoint URL:** Paste Zapier webhook URL
4. **Events to send:** Select:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. **Click:** "Add endpoint"
6. **Copy:** Signing secret (starts with `whsec_...`)

---

### Option B: Direct Webhook to Your API (Advanced)

If you want to handle webhooks in your Next.js app:

1. **Create webhook endpoint:** `app/api/webhooks/stripe/route.ts`
2. **Verify webhook signature** from Stripe
3. **Send data to Zapier** via Zapier webhook

---

## 5️⃣ Set Up Custom Domain (If Not Done)

### Step 1: Add Domain in Vercel

1. **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. **Click:** "Add Domain"
3. **Enter:** `velocitymaid.com` (or `www.velocitymaid.com`)
4. **Click:** "Add"

### Step 2: Update DNS Records

Vercel will show you DNS records to add. Go to your domain registrar:

**For Apex Domain (velocitymaid.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Wait for DNS Propagation

- Usually takes 5-60 minutes
- Check at: https://dnschecker.org

### Step 4: Update Environment Variable

1. **Vercel** → **Settings** → **Environment Variables**
2. **Update:** `NEXT_PUBLIC_BASE_URL`
3. **Value:** `https://velocitymaid.com`
4. **Redeploy**

---

## 6️⃣ Test Everything End-to-End

### Test Checklist:

#### ✅ Website Loads
- [ ] Visit: `https://velocitymaid.com`
- [ ] Homepage loads correctly
- [ ] Images display
- [ ] Navigation works

#### ✅ Booking Flow
- [ ] Click "Book Now" button
- [ ] Fill out booking form
- [ ] Click "Continue to Payment"
- [ ] Stripe Checkout opens
- [ ] Complete test payment (card: `4242 4242 4242 4242`)
- [ ] Redirects to success page

#### ✅ Stripe Integration
- [ ] Go to: https://dashboard.stripe.com/payments
- [ ] See test payment in dashboard
- [ ] Payment details are correct

#### ✅ Zapier Notifications
- [ ] Check your email/SMS
- [ ] Should receive notification about new booking
- [ ] Verify booking details in notification

#### ✅ Google Analytics
- [ ] Go to: https://analytics.google.com
- [ ] Reports → Realtime
- [ ] See yourself as active user
- [ ] Test events:
  - [ ] `phone_clicked` (click phone number)
  - [ ] `whatsapp_clicked` (click WhatsApp)
  - [ ] `booking_started` (visit /booking)
  - [ ] `booking_submitted` (submit form)

#### ✅ WhatsApp Integration
- [ ] Click WhatsApp button
- [ ] WhatsApp opens with pre-filled message
- [ ] Can send message

#### ✅ Phone Links
- [ ] Click phone number
- [ ] Phone dialer opens with number

---

## 7️⃣ Production Checklist

Before going fully live:

### Security
- [ ] Using **live Stripe keys** (not test keys) in Vercel Production
- [ ] `.env.local` is in `.gitignore` (not committed)
- [ ] No API keys in code
- [ ] HTTPS enabled (automatic with Vercel)

### Performance
- [ ] Images optimized
- [ ] Site loads in < 3 seconds
- [ ] Mobile responsive

### Monitoring
- [ ] Google Analytics tracking working
- [ ] Zapier notifications working
- [ ] Error monitoring set up (optional: Sentry)

### Testing
- [ ] Test booking flow end-to-end
- [ ] Test with real payment (small amount)
- [ ] Verify email/SMS notifications
- [ ] Check all links work

---

## 🔧 Troubleshooting

### Issue: Stripe Not Working

**Check:**
1. Environment variable `STRIPE_SECRET_KEY` is set in Vercel
2. Using correct key (test vs live)
3. Redeployed after adding variable
4. Check Vercel logs: **Deployments** → Click deployment → **Logs**

### Issue: Google Analytics Not Tracking

**Check:**
1. Measurement ID is correct in `app/layout.tsx`
2. Site is deployed with updated code
3. Ad blockers disabled (they block GA)
4. Check browser console for errors (F12)

### Issue: Zapier Not Receiving Webhooks

**Check:**
1. Webhook URL is correct in Stripe
2. Zap is turned ON in Zapier
3. Webhook events are selected correctly
4. Check Stripe webhook logs: **Developers** → **Webhooks** → Click endpoint → **Logs**

### Issue: Domain Not Working

**Check:**
1. DNS records are correct
2. DNS propagated (check at dnschecker.org)
3. Domain added in Vercel
4. SSL certificate issued (automatic, may take a few minutes)

---

## 📞 Quick Reference

### Important URLs:

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Zapier:** https://zapier.com/app/zaps
- **Google Analytics:** https://analytics.google.com
- **GitHub Repo:** https://github.com/Maylor-tech/velocitymaid-nextjs

### Environment Variables Needed:

```env
# In Vercel (Production)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_BASE_URL=https://velocitymaid.com

# In Vercel (Development/Preview)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
```

### Key Files:

- `app/layout.tsx` - Google Analytics ID
- `app/api/checkout/route.ts` - Stripe integration
- `app/booking/page.tsx` - Booking form & GA events
- `app/page.tsx` - Homepage & GA events

---

## ✅ You're All Set!

Once everything is connected:
- ✅ GitHub auto-deploys to Vercel
- ✅ Stripe processes payments
- ✅ Zapier sends notifications
- ✅ Google Analytics tracks everything
- ✅ WhatsApp and phone links work

Your website is fully connected and ready for business! 🎉

