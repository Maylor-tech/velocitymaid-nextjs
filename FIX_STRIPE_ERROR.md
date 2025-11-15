# 🔧 Fix Stripe API Key Error

## The Error You're Seeing

```
This API call cannot be made with a publishable API key. 
Please use a secret API key.
```

## Quick Fix (3 Steps)

### Step 1: Get Your Stripe Secret Key

1. **Go to:** https://dashboard.stripe.com/test/apikeys
2. **Click "Reveal test key"** next to **"Secret key"** (NOT publishable key)
3. **Copy the key** - it should start with `sk_test_...`

⚠️ **IMPORTANT:** Make sure it starts with `sk_test_` NOT `pk_test_`
- ✅ **Correct:** `sk_test_51AbC123...` (Secret key)
- ❌ **Wrong:** `pk_test_51AbC123...` (Publishable key)

### Step 2: Create `.env.local` File

1. **In your `velocitymaid-nextjs` folder**, create a new file
2. **Name it exactly:** `.env.local` (with the dot at the start)
3. **Paste this content:**

```env
STRIPE_SECRET_KEY=sk_test_paste_your_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Replace** `sk_test_paste_your_key_here` with the key you copied in Step 1
5. **Save the file**

### Step 3: Restart Your Dev Server

**This is critical!** Environment variables are only loaded when the server starts.

1. **Stop your dev server:**
   - Press `Ctrl+C` in the terminal where it's running

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Test the booking form:**
   - Go to: http://localhost:3000/booking
   - Fill out the form
   - Click "Continue to Secure Payment"
   - Should redirect to Stripe Checkout (no error!)

---

## Verify Your Setup

### Check Your `.env.local` File

Open `.env.local` and make sure:

✅ File is named exactly `.env.local` (with the dot)  
✅ File is in the `velocitymaid-nextjs` folder (same folder as `package.json`)  
✅ Key starts with `sk_test_` (NOT `pk_test_`)  
✅ No extra spaces or quotes around the key  
✅ You restarted the dev server after creating/editing the file

### Example of Correct `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_51AbC123xYz789...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Still Not Working?

### Check 1: File Location
Make sure `.env.local` is in the **same folder** as:
- `package.json`
- `next.config.js`
- `app/` folder

### Check 2: Key Format
Your key should look like:
```
sk_test_51AbC123xYz789Def456Ghi012Jkl345Mno678Pqr901Stu234Vwx567
```

### Check 3: Server Restart
**You MUST restart the dev server** after creating or editing `.env.local`:
```bash
# Stop server (Ctrl+C)
# Then start again:
npm run dev
```

### Check 4: Check Terminal for Errors
Look at your terminal where `npm run dev` is running. If you see:
```
STRIPE_SECRET_KEY is not set...
```
Then the file isn't being read. Check the file location and name.

---

## Need Help?

If you're still stuck:

1. **Double-check your Stripe dashboard:**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Make sure you're copying the **Secret key** (sk_test_...)
   - NOT the Publishable key (pk_test_...)

2. **Verify file exists:**
   - In your file explorer, go to `velocitymaid-nextjs` folder
   - Make sure you can see `.env.local` file
   - If you can't see it, you might need to enable "Show hidden files"

3. **Test with a simple check:**
   - Add this to your `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_51AbC123...
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   TEST_VAR=hello
   ```
   - Restart server
   - In your code, try: `console.log(process.env.TEST_VAR)` - should print "hello"

---

## For Production (Later)

When you're ready to go live:

1. **Get your LIVE secret key:**
   - Go to: https://dashboard.stripe.com
   - Toggle to **LIVE MODE** (top right)
   - Go to: Developers → API keys
   - Copy the **Secret key** (starts with `sk_live_...`)

2. **Add to Vercel:**
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `STRIPE_SECRET_KEY` = `sk_live_your_key_here`
   - Add: `NEXT_PUBLIC_BASE_URL` = `https://your-domain.com`
   - Redeploy

---

**That's it!** Once you have the correct secret key in `.env.local` and restart the server, the error should be gone. 🎉

