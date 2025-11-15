# 🚀 Quick Deploy Guide - 5 Minutes

## Step 1: Get Stripe Keys (2 minutes)

1. **Go to:** https://dashboard.stripe.com/test/apikeys
2. **Copy your Secret key** (starts with `sk_test_...`)
3. **Keep it handy** - you'll paste it in Step 2

---

## Step 2: Create .env.local File (1 minute)

**Create a file named `.env.local` in the `velocitymaid-nextjs` folder with:**

```env
STRIPE_SECRET_KEY=sk_test_paste_your_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Replace** `sk_test_paste_your_key_here` with your actual key from Step 1.

---

## Step 3: Test Locally (1 minute)

```bash
npm run dev
```

**Open:** http://localhost:3000/booking

**Test with Stripe test card:**
- Card: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`
- ZIP: `12345`

---

## Step 4: Deploy to Vercel (1 minute)

### If you have Vercel CLI:
```bash
vercel --prod
```

### If not, use GitHub:
1. **Commit and push:**
   ```bash
   git add .
   git commit -m "Ready for launch"
   git push
   ```

2. **Go to:** https://vercel.com
3. **Import your GitHub repo**
4. **Add environment variables:**
   - `STRIPE_SECRET_KEY` = your key
   - `NEXT_PUBLIC_BASE_URL` = your domain

---

## ✅ Done!

Your site is live! 🎉

**Full guide:** See `STRIPE_SETUP_GUIDE.md` for detailed instructions.

