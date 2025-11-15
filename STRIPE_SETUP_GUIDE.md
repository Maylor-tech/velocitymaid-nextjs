# 🔑 Stripe Setup Guide - Step by Step

## Step 1: Get Your Stripe API Keys

### For Testing (Development):
1. Go to: https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - Not needed for this setup
   - **Secret key** (starts with `sk_test_...`) - **Copy this one**

### For Production (Live):
1. Go to: https://dashboard.stripe.com
2. **Toggle to LIVE MODE** (switch in top right - it should say "Test mode" when off)
3. Go to: **Developers** → **API keys**
4. Click **"Reveal test key"** or **"Reveal live key"** to see your secret key
5. Copy the **Secret key** (starts with `sk_live_...` for production)

---

## Step 2: Create .env.local File

1. **In your project root** (`velocitymaid-nextjs` folder), create a file named `.env.local`
2. **Add these lines:**

```env
# For Development/Testing (use test keys)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# For Production (use live keys)
# STRIPE_SECRET_KEY=sk_live_your_live_key_here
# NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
```

3. **Replace** `sk_test_your_test_key_here` with your actual test key
4. **Save the file**

---

## Step 3: Test Locally

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open:** http://localhost:3000/booking

3. **Fill out the form** and test the checkout flow

4. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

---

## Step 4: Deploy to Vercel

### Option A: If Already Connected to Vercel

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add Stripe integration and booking form"
   git push
   ```

2. **Vercel will auto-deploy** (if connected to GitHub)

### Option B: First Time Deploy

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project? **Yes** (if you have one)
   - Or create new project

---

## Step 5: Add Environment Variables in Vercel

**CRITICAL:** You must add your Stripe keys in Vercel!

1. **Go to:** https://vercel.com/dashboard
2. **Click on your project** (velocitymaid-nextjs)
3. **Go to:** Settings → Environment Variables
4. **Add these variables:**

   **For Production:**
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** `sk_live_your_actual_live_key_here`
   - **Environment:** Production, Preview, Development (check all)

   - **Name:** `NEXT_PUBLIC_BASE_URL`
   - **Value:** `https://your-domain.vercel.app` (or your custom domain)
   - **Environment:** Production, Preview, Development (check all)

5. **Click "Save"**

6. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

---

## Step 6: Verify It Works

1. **Visit your live site:** https://your-domain.vercel.app/booking
2. **Fill out the form**
3. **Test with a real card** (small amount like $1)
4. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/payments
   - You should see the test payment

---

## 🔴 Important Notes

### Test vs Live Keys

- **Test keys** (`sk_test_...`): Use for development, won't charge real money
- **Live keys** (`sk_live_...`): Use for production, charges real money

### Security

- ✅ `.env.local` is in `.gitignore` (won't be committed)
- ✅ Never share your secret keys
- ✅ Never commit keys to GitHub
- ✅ Use environment variables in Vercel (not hardcoded)

### Testing Payments

**Test Cards (use with test keys):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

**More test cards:** https://stripe.com/docs/testing

---

## 🆘 Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Make sure `.env.local` exists in project root
- Make sure variable name is exactly `STRIPE_SECRET_KEY`
- Restart dev server after creating `.env.local`

### "Invalid API Key"
- Check you copied the full key (starts with `sk_test_` or `sk_live_`)
- Make sure there are no extra spaces
- Verify you're using the right key (test vs live)

### Build fails on Vercel
- Make sure environment variables are set in Vercel
- Check that variable names match exactly
- Redeploy after adding variables

---

## ✅ Checklist

- [ ] Got Stripe API keys (test and live)
- [ ] Created `.env.local` with test key
- [ ] Tested locally with test card
- [ ] Deployed to Vercel
- [ ] Added environment variables in Vercel
- [ ] Used LIVE keys for production
- [ ] Tested on live site
- [ ] Verified payment appears in Stripe dashboard

---

**Need help?** Check Stripe docs: https://stripe.com/docs

