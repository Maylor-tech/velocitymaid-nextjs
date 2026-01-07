# 🚀 Deploy to Vercel - Quick Guide

## Pre-Deployment Checklist

Before deploying, make sure:

1. **Environment Variables are Set in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables (see below)

2. **Database is Ready**
   - Production database URL is set
   - Migrations can be run

3. **Stripe is Configured** (if using billing)
   - Live mode API keys
   - Webhook endpoint configured

## Required Environment Variables

Add these in Vercel Dashboard:

```bash
DATABASE_URL=your_production_database_url
DIRECT_URL=your_direct_database_url
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Optional (for billing):
```bash
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS=price_...
```

## Deployment Options

### Option 1: Deploy via Vercel CLI (Recommended)
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 2: Deploy via Git Push
```bash
# Commit your changes
git add .
git commit -m "feat: add SaaS multi-tenancy and billing system"

# Push to main branch (Vercel auto-deploys)
git push origin main
```

### Option 3: Deploy via Vercel Dashboard
1. Go to https://vercel.com
2. Select your project
3. Click "Deploy" → "Deploy Latest"

## Post-Deployment

1. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify Deployment**
   - Visit: `https://yourdomain.com/api/health`
   - Should return 200 OK

3. **Test User Flows**
   - Visit: `https://yourdomain.com/saas`
   - Test signup
   - Test login
   - Test dashboard

4. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Enable events: `checkout.session.completed`, `invoice.payment_succeeded`

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify `DATABASE_URL` is correct
- Check build logs in Vercel dashboard

### Database Connection Errors
- Verify `DATABASE_URL` and `DIRECT_URL` are set
- Check database allows connections from Vercel IPs
- Run migrations: `npx prisma migrate deploy`

### Stripe Errors
- Verify using correct key (live vs test)
- Check webhook secret matches
- Verify webhook endpoint is accessible

---

**Ready to deploy!** 🚀
