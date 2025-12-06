# 🚀 GO LIVE - Complete Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Setup

**Required for Production:**

#### In Vercel Dashboard → Settings → Environment Variables:

Add these variables (mark for Production, Preview, and Development):

```
DATABASE_URL=postgresql://postgres:Bornfidis2026@db.wkqglgdoseptvttrkapa.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:Bornfidis2026@db.wkqglgdoseptvttrkapa.supabase.co:5432/postgres

STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_YOUR_PUBLISHABLE_KEY

NEXT_PUBLIC_BASE_URL=https://velocitymaid.com
NEXT_PUBLIC_APP_NAME=VelocityMaid
NEXT_PUBLIC_APP_URL=https://velocitymaid.com
NEXT_PUBLIC_ENVIRONMENT=production

NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-E1HJNJ3LTW

WHATSAPP_TOKEN=YOUR_WHATSAPP_TOKEN
WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID
ADMIN_WHATSAPP_NJ=+1973xxxxxxx
ADMIN_WHATSAPP_VT=+1802xxxxxxx
```

**⚠️ Important:**
- Use **LIVE** Stripe keys (not test keys) for production
- Replace `YOUR_LIVE_KEY_HERE` with actual values
- Update phone numbers with real numbers

---

### 2. Database Verification

**Verify your database is ready:**

1. ✅ Branch exists: `new-jersey-branch` (confirmed)
2. ✅ All migrations applied (16 migrations)
3. ✅ Prisma Client generated

**Test locally:**
```bash
npm run build
```
Should complete without errors.

---

### 3. Build Verification

**Run production build:**
```bash
npm run build
```

**Check for:**
- ✅ No TypeScript errors
- ✅ No build errors
- ✅ All pages compile successfully

---

### 4. Code Review

**Quick checks:**
- ✅ All admin lead pages fixed
- ✅ Error boundaries in place
- ✅ Branch slug normalization working
- ✅ No hardcoded localhost URLs in production code

---

## 🚀 Deployment Steps

### Option A: Deploy via Vercel Dashboard (Easiest)

**Step 1: Push to GitHub**
```bash
cd velocitymaid-nextjs
git add .
git commit -m "Ready for production deployment"
git push origin main
```

**Step 2: Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign in (use GitHub for easiest setup)
3. Click **"New Project"**
4. Import your GitHub repository
5. Vercel auto-detects Next.js settings

**Step 3: Configure Environment Variables**
1. Before deploying, go to **Settings** → **Environment Variables**
2. Add all variables from checklist above
3. Make sure to select **Production**, **Preview**, and **Development**

**Step 4: Deploy**
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your site is live! 🎉

---

### Option B: Deploy via Vercel CLI (Fast)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login**
```bash
vercel login
```

**Step 3: Deploy**
```bash
cd velocitymaid-nextjs
vercel --prod
```

**Step 4: Add Environment Variables**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all variables from checklist above

**Step 5: Redeploy**
```bash
vercel --prod
```

---

## 🌐 Domain Setup

### Connect Custom Domain

**In Vercel Dashboard:**
1. Go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `velocitymaid.com`
4. Follow DNS instructions

**DNS Records to Add (at your domain registrar):**

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Wait 5-60 minutes** for DNS propagation.

---

## ✅ Post-Deployment Verification

### 1. Test Core Pages

Visit and verify:
- ✅ Homepage: `https://velocitymaid.com`
- ✅ Booking: `https://velocitymaid.com/booking`
- ✅ Admin Leads: `https://velocitymaid.com/admin/leads/nj`
- ✅ Review Page: `https://velocitymaid.com/review-us/new-jersey`

### 2. Test Functionality

- ✅ Booking form submits
- ✅ Stripe payment works (use test mode first)
- ✅ Admin pages load
- ✅ Database connections work
- ✅ No console errors

### 3. Check Performance

- ✅ Page loads fast
- ✅ Images optimized
- ✅ No 404 errors
- ✅ Mobile responsive

---

## 🔒 Security Checklist

- ✅ All API keys in environment variables (not in code)
- ✅ `.env.local` is in `.gitignore` (not committed)
- ✅ Using HTTPS (automatic with Vercel)
- ✅ Database connection uses SSL

---

## 📊 Monitoring Setup

### 1. Google Analytics
- ✅ Already configured: `G-E1HJNJ3LTW`
- Verify it's tracking in production

### 2. Error Monitoring
- Consider adding Sentry or similar for production error tracking

---

## 🆘 If Something Goes Wrong

### Build Fails?
1. Check Vercel build logs
2. Verify all environment variables are set
3. Check for TypeScript errors locally: `npm run build`

### Database Connection Issues?
1. Verify `DATABASE_URL` is correct in Vercel
2. Check Supabase connection settings
3. Ensure database allows connections from Vercel IPs

### Pages Not Loading?
1. Check browser console for errors
2. Check Vercel function logs
3. Verify all environment variables are set

---

## 🎯 Quick Reference

**Deploy Command:**
```bash
vercel --prod
```

**Check Deployment Status:**
```bash
vercel ls
```

**View Logs:**
```bash
vercel logs
```

**Redeploy:**
```bash
vercel --prod --force
```

---

## 📝 Final Checklist Before Going Live

```
[ ] All environment variables added to Vercel
[ ] Production build succeeds locally
[ ] Database connection tested
[ ] Stripe LIVE keys configured
[ ] Custom domain connected (if applicable)
[ ] All pages tested and working
[ ] Mobile responsiveness verified
[ ] No console errors
[ ] Analytics tracking verified
[ ] Backup of .env.local file saved securely
```

---

## 🎉 You're Live!

Once deployed, your site will be available at:
- Vercel URL: `https://your-project.vercel.app`
- Custom Domain: `https://velocitymaid.com` (after DNS setup)

**Next Steps:**
1. Monitor for errors in first 24 hours
2. Test all critical user flows
3. Set up monitoring/alerts
4. Plan for scaling if needed

---

**Need help?** Check:
- `DEPLOYMENT.md` - Detailed deployment guide
- `TROUBLESHOOTING.md` - Common issues and solutions
- Vercel Dashboard → Logs - Real-time error logs

