# 🚨 ACTION PLAN - Get Everything Working NOW

Follow these steps **IN ORDER**. Do not skip steps.

---

## ✅ STEP 1: Fix Git and Push to GitHub (5 minutes)

### Option A: Simple Reset (Recommended if you don't care about git history)

1. **Open PowerShell in your project folder:**
   ```
   C:\Users\18023\OneDrive\Documents\velocitymaid-nextjs\velocitymaid-nextjs
   ```

2. **Run these commands one by one:**
   ```powershell
   git fetch origin
   git reset --hard origin/main
   git add .
   git commit -m "Add Google Analytics, fix URLs, connection guides"
   git push origin main --force
   ```

### Option B: If Option A doesn't work, use this:

```powershell
git fetch origin
git merge origin/main --allow-unrelated-histories
git add .
git commit -m "Merge and add all updates"
git push origin main
```

**✅ CHECK:** Go to https://github.com/Maylor-tech/velocitymaid-nextjs - you should see your latest commit

---

## ✅ STEP 2: Verify Vercel Deployment (2 minutes)

1. **Go to:** https://vercel.com/dashboard
2. **Click your project:** `velocitymaid-nextjs`
3. **Check Deployments tab:**
   - Should see a new deployment (or trigger one)
   - If not auto-deployed, click **"Redeploy"** on latest deployment
4. **Visit your site:** https://velocitymaid.com (or your Vercel URL)
   - Should load correctly

**✅ CHECK:** Site loads at https://velocitymaid.com

---

## ✅ STEP 3: Add Environment Variables in Vercel (CRITICAL - 5 minutes)

**Without this, Stripe won't work!**

1. **Go to:** https://vercel.com/dashboard → Your Project → **Settings** → **Environment Variables**

2. **Add Variable 1:**
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** Get from https://dashboard.stripe.com/test/apikeys
     - Click "Reveal test key" next to **Secret key**
     - Copy the key (starts with `sk_test_...`)
   - **Environments:** ✅ Production ✅ Preview ✅ Development
   - Click **"Save"**

3. **Add Variable 2:**
   - **Name:** `NEXT_PUBLIC_BASE_URL`
   - **Value:** `https://velocitymaid.com`
   - **Environments:** ✅ Production ✅ Preview ✅ Development
   - Click **"Save"**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Wait 1-2 minutes

**✅ CHECK:** After redeploy, test booking form - should redirect to Stripe

---

## ✅ STEP 4: Connect Stripe to Zapier (10 minutes)

### Part A: Create Zap in Zapier

1. **Go to:** https://zapier.com/app/zaps
2. **Click:** "+ Create Zap"
3. **Trigger:**
   - Search: **"Stripe"**
   - Event: **"New Payment"** or **"Payment Succeeded"**
   - Click **"Continue"**
4. **Connect Stripe:**
   - Click **"Sign in to Stripe"**
   - Authorize Zapier to access your Stripe account
   - Click **"Continue"**
5. **Test Trigger:**
   - Click **"Test trigger"**
   - Should see sample payment data
   - Click **"Continue"**

### Part B: Add Email Action

6. **Action:**
   - Search: **"Email by Zapier"**
   - Event: **"Send Outbound Email"**
   - Click **"Continue"**
7. **Configure Email:**
   - **To:** Your email (e.g., `hello@velocitymaid.com`)
   - **Subject:** `New Booking: {{Email}}`
   - **Body:** Copy and paste this:
     ```
     🎉 New Booking Received!
     
     Customer: {{Email}}
     Name: {{First Name}} {{Last Initial}}
     Phone: {{Phone}}
     Service: {{Service Type}}
     Date: {{Preferred Date}}
     Time: {{Preferred Time}}
     Total: ${{Amount}}
     
     Address: {{Address}}
     Special Instructions: {{Special Instructions}}
     ```
   - Click **"Continue"**
8. **Test Action:**
   - Click **"Test action"**
   - Check your email - should receive test email
   - Click **"Continue"**
9. **Turn On Zap:**
   - Click **"Turn on Zap"** (top right)
   - Zap is now active!

**✅ CHECK:** Make a test booking - you should receive email notification

---

## ✅ STEP 5: Get Stripe Webhook URL (5 minutes)

### Option A: Use Zapier Webhook (Easier)

1. **In your Zap, go to Trigger step**
2. **Look for "Webhook" or "Webhook URL"**
3. **Copy the webhook URL** (looks like: `https://hooks.zapier.com/hooks/catch/...`)

### Option B: Create Webhook Zap (If Option A doesn't work)

1. **Create NEW Zap:**
   - Trigger: **"Webhooks by Zapier"** → **"Catch Hook"**
   - Copy the webhook URL
   - Add Action: **"Email by Zapier"** → **"Send Outbound Email"**
   - Turn on Zap
   - Use the webhook URL from step 1

---

## ✅ STEP 6: Add Webhook to Stripe (5 minutes)

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Click:** "+ Add endpoint"
3. **Endpoint URL:** Paste the Zapier webhook URL from Step 5
4. **Description:** `Zapier Booking Notifications`
5. **Events to send:** Click **"Select events"**
   - Check: `checkout.session.completed`
   - Check: `payment_intent.succeeded`
   - Click **"Add events"**
6. **Click:** "Add endpoint"
7. **Copy the Signing Secret** (starts with `whsec_...`) - save this for later

**✅ CHECK:** In Stripe → Webhooks, you should see your endpoint with green checkmark

---

## ✅ STEP 7: Update Google Analytics ID (2 minutes)

1. **Get your GA4 ID:**
   - Go to: https://analytics.google.com
   - Admin → Data Streams → Click your stream
   - Copy **Measurement ID** (format: `G-XXXXXXXXXX`)

2. **Update in code:**
   - Open: `app/layout.tsx`
   - Find line 121: `<GoogleAnalytics gaId="G-XXXXXXXXXX" />`
   - Replace `G-XXXXXXXXXX` with your real ID
   - Save

3. **Push to GitHub:**
   ```powershell
   git add app/layout.tsx
   git commit -m "Update Google Analytics ID"
   git push origin main
   ```

**✅ CHECK:** Vercel auto-deploys, then check GA4 Realtime - should see yourself

---

## ✅ STEP 8: Test Everything End-to-End (5 minutes)

### Test Checklist:

1. **Website:**
   - [ ] Visit: https://velocitymaid.com
   - [ ] Homepage loads
   - [ ] Images display

2. **Booking Form:**
   - [ ] Click "Book Now"
   - [ ] Fill out form
   - [ ] Click "Continue to Payment"
   - [ ] Stripe Checkout opens
   - [ ] Use test card: `4242 4242 4242 4242`
   - [ ] Complete payment
   - [ ] Redirects to success page

3. **Stripe:**
   - [ ] Go to: https://dashboard.stripe.com/payments
   - [ ] See test payment in dashboard

4. **Zapier:**
   - [ ] Check your email
   - [ ] Should receive booking notification with all details

5. **Google Analytics:**
   - [ ] Go to: https://analytics.google.com
   - [ ] Reports → Realtime
   - [ ] See yourself as active user
   - [ ] Test events (click phone, WhatsApp, etc.)

---

## 🆘 TROUBLESHOOTING

### Issue: Git push fails
**Solution:** Use `git push origin main --force` (only if you're sure)

### Issue: Vercel not deploying
**Solution:** 
1. Check Vercel → Settings → Git (should show GitHub connected)
2. Manually trigger: Deployments → "..." → "Redeploy"

### Issue: Stripe not working
**Solution:**
1. Check Vercel → Settings → Environment Variables
2. Make sure `STRIPE_SECRET_KEY` is set
3. Redeploy after adding variable

### Issue: Zapier not receiving webhooks
**Solution:**
1. Check Stripe → Webhooks → Your endpoint → Logs
2. Make sure endpoint is active (green checkmark)
3. Test webhook in Stripe dashboard

### Issue: Site not loading
**Solution:**
1. Check Vercel → Deployments → Latest → Logs
2. Look for errors
3. Check domain DNS settings

---

## 📞 QUICK REFERENCE

### Important URLs:
- **GitHub:** https://github.com/Maylor-tech/velocitymaid-nextjs
- **Vercel:** https://vercel.com/dashboard
- **Stripe:** https://dashboard.stripe.com
- **Zapier:** https://zapier.com/app/zaps
- **Google Analytics:** https://analytics.google.com
- **Your Site:** https://velocitymaid.com

### Environment Variables Needed:
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
```

---

## ✅ FINAL CHECKLIST

Before considering it done:
- [ ] Code pushed to GitHub
- [ ] Site deployed on Vercel
- [ ] Environment variables set in Vercel
- [ ] Stripe processes payments
- [ ] Zapier sends email notifications
- [ ] Google Analytics tracking works
- [ ] Test booking works end-to-end

---

**You're done when:**
1. Customer fills booking form
2. Payment processes in Stripe
3. You receive email notification with booking details
4. Everything tracks in Google Analytics

**That's it! Follow these steps in order and you'll be done in 30 minutes.**


