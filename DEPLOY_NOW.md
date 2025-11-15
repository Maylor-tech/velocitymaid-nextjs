# 🚀 DEPLOY NOW - Step by Step

## ✅ What's Ready
- ✅ Booking form (1 page, fast)
- ✅ Stripe integration
- ✅ Form validation
- ✅ Success/failed pages
- ✅ Build passes
- ✅ Code is ready

## 🔴 What You Need to Do (5 Steps)

### STEP 1: Get Stripe Test Key (2 min)

1. Open: https://dashboard.stripe.com/test/apikeys
2. Click "Reveal test key" next to "Secret key"
3. Copy the key (starts with `sk_test_...`)
4. Keep it open - you'll paste it next

---

### STEP 2: Create .env.local File (1 min)

**In your project folder** (`velocitymaid-nextjs`), create a new file:

**File name:** `.env.local` (exactly this name, including the dot)

**File contents:**
```env
STRIPE_SECRET_KEY=sk_test_paste_your_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Replace** `sk_test_paste_your_key_here` with the key you copied in Step 1.

**Save the file.**

---

### STEP 3: Test Locally (2 min)

Run this command:
```bash
npm run dev
```

Then:
1. Open: http://localhost:3000/booking
2. Fill out the form
3. Click "Continue to Payment"
4. Use test card: `4242 4242 4242 4242` (any future date, any CVC)

**If it works → Continue to Step 4**
**If it doesn't → Check your Stripe key is correct**

---

### STEP 4: Commit & Push (1 min)

Run these commands:
```bash
git add .
git commit -m "Launch: Custom booking form with Stripe integration"
git push
```

---

### STEP 5: Add Keys to Vercel (2 min)

1. **Go to:** https://vercel.com/dashboard
2. **Click your project** (velocitymaid-nextjs)
3. **Go to:** Settings → Environment Variables
4. **Add these:**

   **Variable 1:**
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_test_your_key_here` (same key from Step 1)
   - Environments: ✅ Production ✅ Preview ✅ Development

   **Variable 2:**
   - Name: `NEXT_PUBLIC_BASE_URL`
   - Value: `https://your-project.vercel.app` (or your custom domain)
   - Environments: ✅ Production ✅ Preview ✅ Development

5. **Click "Save"**
6. **Go to Deployments tab**
7. **Click "..." on latest deployment → "Redeploy"**

---

## ✅ You're Live!

Visit your site and test the booking form!

---

## 🔄 For Production (When Ready)

When you're ready to accept real payments:

1. **Get LIVE Stripe key:**
   - Go to: https://dashboard.stripe.com
   - Toggle to **LIVE MODE** (top right)
   - Go to: Developers → API Keys
   - Copy **Secret key** (starts with `sk_live_...`)

2. **Update Vercel:**
   - Go to Environment Variables
   - Update `STRIPE_SECRET_KEY` with your LIVE key
   - Update `NEXT_PUBLIC_BASE_URL` with your production domain
   - Redeploy

3. **Update Zapier:**
   - Change trigger from "Google Forms" to "Stripe Payment Success"
   - Test the automation

---

## 🆘 Need Help?

- **Stripe setup:** See `STRIPE_SETUP_GUIDE.md`
- **Full checklist:** See `PRE_LAUNCH_CHECKLIST.md`
- **Quick reference:** See `QUICK_DEPLOY.md`

---

**Ready? Start with Step 1!** 🚀

