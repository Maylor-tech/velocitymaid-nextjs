# ⚡ Quick Action Items - Do These First

## 🔴 CRITICAL (Do Before Launch)

### 1. Set Up Stripe Keys ⚠️
**Time:** 5 minutes
**Impact:** Bookings won't work without this!

**Steps:**
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Click "Reveal test key" next to Secret key
3. Copy the key (starts with `sk_test_...`)
4. Create `.env.local` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_paste_your_key_here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
5. Restart dev server

**See:** `STRIPE_SETUP_GUIDE.md` for details

---

### 2. Update Domain in Files 🌐
**Time:** 2 minutes
**Impact:** SEO and structured data won't work correctly

**Find & Replace in these files:**
- `app/layout.tsx` - Replace `yourdomain.com` (2 places)
- `app/sitemap.ts` - Update `baseUrl` variable
- `public/robots.txt` - Update sitemap URL

**Replace:** `yourdomain.com` → `your-actual-domain.com`

---

## 🟡 IMPORTANT (Do This Week)

### 3. Compress Images ⚡
**Time:** 15 minutes
**Impact:** 50-70% faster loading

**Steps:**
1. Go to: https://tinypng.com
2. Upload all 10 gallery images
3. Download compressed versions
4. Replace in `public/images/gallery/`

**Expected:** Each image under 500KB

---

### 4. Add Favicon 🎨
**Time:** 5 minutes
**Impact:** Professional appearance

**Steps:**
1. Go to: https://favicon.io
2. Create favicon from your logo
3. Download
4. Save as `app/favicon.ico`

---

### 5. Set Up Email Notifications 📧
**Time:** 10 minutes
**Impact:** Never miss a booking

**Easiest Option: Zapier**
1. Sign up at zapier.com (free)
2. Create Zap: Stripe → Email
3. Connect your email
4. Test

**Alternative:** See `PROFESSIONAL_IMPROVEMENTS.md`

---

### 6. Add Google Analytics 📊
**Time:** 15 minutes
**Impact:** Track visitors and conversions

**Steps:**
1. Create Google Analytics 4 account
2. Get tracking ID (G-XXXXXXXXXX)
3. Install package:
   ```bash
   npm install @next/third-parties
   ```
4. Add to `app/layout.tsx`:
   ```typescript
   import { GoogleAnalytics } from '@next/third-parties/google'
   
   // In component:
   <GoogleAnalytics gaId="G-XXXXXXXXXX" />
   ```

---

## ✅ What's Already Done

- ✅ 404 error page
- ✅ robots.txt
- ✅ Sitemap
- ✅ Enhanced SEO metadata
- ✅ Structured data (JSON-LD)
- ✅ All errors fixed
- ✅ All images working
- ✅ Booking form ready
- ✅ Mobile responsive

---

## 🎯 Priority Order

1. **Stripe keys** (5 min) - CRITICAL
2. **Update domain** (2 min) - Important
3. **Compress images** (15 min) - Performance
4. **Email notifications** (10 min) - Business
5. **Analytics** (15 min) - Tracking
6. **Favicon** (5 min) - Polish

**Total Time:** ~52 minutes for all critical items

---

## 🚀 After These Are Done

Your site will be:
- ✅ Fully functional
- ✅ Fast loading
- ✅ SEO optimized
- ✅ Trackable
- ✅ Professional
- ✅ Ready for customers

---

**Start with Stripe keys - it's the most critical!** ⚠️

