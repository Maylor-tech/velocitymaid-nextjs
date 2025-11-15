# ⚡ Quick Connection Checklist

Follow these steps in order to connect everything:

---

## 🔴 STEP 1: Update Google Analytics ID (2 min)

1. **Get your GA4 ID:**
   - Go to: https://analytics.google.com
   - Admin → Data Streams → Copy Measurement ID (`G-XXXXXXXXXX`)

2. **Update code:**
   - Open: `app/layout.tsx`
   - Line 121: Replace `G-XXXXXXXXXX` with your real ID
   - Save

3. **Deploy:**
   ```bash
   git add app/layout.tsx
   git commit -m "Update Google Analytics ID"
   git push
   ```

---

## 🔴 STEP 2: Add Environment Variables to Vercel (5 min)

1. **Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

2. **Add Variable 1:**
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_live_YOUR_KEY` (from Stripe Dashboard → Live Mode)
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

3. **Add Variable 2:**
   - Name: `NEXT_PUBLIC_BASE_URL`
   - Value: `https://velocitymaid.com`
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

4. **Redeploy:**
   - Go to: Deployments tab
   - Click "..." on latest → "Redeploy"

---

## 🔴 STEP 3: Connect Zapier to Stripe (10 min)

### Option A: Stripe → Zapier Webhook

1. **Create Zap:**
   - Go to: https://zapier.com/app/zaps
   - Click: "+ Create Zap"
   - Trigger: "Stripe" → "New Payment"
   - Connect Stripe account
   - Test trigger

2. **Add Action:**
   - Action: "Email by Zapier" → "Send Outbound Email"
   - To: Your email
   - Subject: `New Booking: {{customer_email}}`
   - Body: Include booking details
   - Test action

3. **Turn On Zap**

4. **Get Webhook URL:**
   - In Zap → Trigger step → Copy webhook URL

5. **Add to Stripe:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click: "+ Add endpoint"
   - URL: Paste Zapier webhook URL
   - Events: `checkout.session.completed`
   - Click: "Add endpoint"

---

## 🔴 STEP 4: Verify GitHub → Vercel Connection (2 min)

1. **Check Vercel:**
   - Go to: Settings → Git
   - Should see: `Maylor-tech/velocitymaid-nextjs` connected

2. **If NOT connected:**
   - Click: "Connect Git Repository"
   - Select: `Maylor-tech/velocitymaid-nextjs`
   - Branch: `main`
   - Click: "Connect"

3. **Test:**
   - Make small change
   - `git push`
   - Check Vercel → Should auto-deploy

---

## 🔴 STEP 5: Test Everything (5 min)

### Test Each Component:

- [ ] **Website:** Visit `https://velocitymaid.com` → Should load
- [ ] **Booking:** Fill form → Stripe checkout works
- [ ] **Stripe:** Check dashboard → Payment appears
- [ ] **Zapier:** Check email → Notification received
- [ ] **Google Analytics:** 
  - Visit site
  - Check GA4 → Realtime → See yourself
  - Click phone → Check Events → `phone_clicked`
  - Click WhatsApp → Check Events → `whatsapp_clicked`
- [ ] **WhatsApp:** Click button → WhatsApp opens
- [ ] **Phone:** Click number → Dialer opens

---

## ✅ Done!

Everything should now be connected:
- ✅ GitHub → Vercel (auto-deploy)
- ✅ Stripe (payments working)
- ✅ Zapier (notifications working)
- ✅ Google Analytics (tracking working)
- ✅ WhatsApp & Phone (links working)

---

## 🆘 Need Help?

See full guide: `CONNECT_EVERYTHING.md`

