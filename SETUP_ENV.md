# 🔧 Setting Up .env.local File

## Quick Setup

I've created a template file for you! Here's what to do:

### Option 1: File Already Created (Easiest)

If `.env.local` was created automatically:

1. **Open the file** `.env.local` in your editor
2. **Find this line:**
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   ```
3. **Replace** `sk_test_your_stripe_secret_key_here` with your actual Stripe key
4. **Save the file**

### Option 2: Create Manually

If the file wasn't created, do this:

1. **In your `velocitymaid-nextjs` folder**, create a new file
2. **Name it exactly:** `.env.local` (with the dot at the start)
3. **Paste this content:**
   ```env
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
4. **Replace** `sk_test_your_stripe_secret_key_here` with your Stripe key
5. **Save**

---

## Where to Get Your Stripe Key

1. **Go to:** https://dashboard.stripe.com/test/apikeys
2. **Click "Reveal test key"** next to "Secret key"
3. **Copy the key** (starts with `sk_test_...`)
4. **Paste it** in your `.env.local` file

---

## Verify It Works

After creating `.env.local`:

1. **Restart your dev server** (if running):
   ```bash
   # Press Ctrl+C to stop, then:
   npm run dev
   ```

2. **Test the booking form:**
   - Go to: http://localhost:3000/booking
   - Fill out the form
   - Click "Continue to Payment"
   - Should redirect to Stripe Checkout

---

## Important Notes

✅ **`.env.local` is in `.gitignore`** - it won't be committed to git  
✅ **Never share your secret keys**  
✅ **Use test keys** (`sk_test_...`) for development  
✅ **Use live keys** (`sk_live_...`) for production (in Vercel)

---

## Troubleshooting

### "STRIPE_SECRET_KEY is not set" error
- Make sure file is named exactly `.env.local` (with the dot)
- Make sure it's in the `velocitymaid-nextjs` folder (same folder as `package.json`)
- Restart your dev server after creating the file

### File not saving
- Make sure you're saving as `.env.local` (not `.env.local.txt`)
- Some editors add `.txt` extension - remove it

---

**Need help?** See `STRIPE_SETUP_GUIDE.md` for more details.

