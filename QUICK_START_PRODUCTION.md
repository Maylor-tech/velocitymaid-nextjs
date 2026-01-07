# 🚀 Quick Start: Production Deployment

## ⚡ 5-Minute Setup

### 1. Environment Variables (Required)
Add these to your production environment (Vercel/your hosting):

```bash
DATABASE_URL=your_production_database_url
DIRECT_URL=your_direct_database_url
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Stripe Setup (5 minutes)
1. Go to Stripe Dashboard → Products
2. Create 3 products:
   - **Starter** - $99/month recurring
   - **Pro** - $199/month recurring  
   - **Business** - $399/month recurring
3. Copy Price IDs → Add to env vars:
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_...
   NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
   NEXT_PUBLIC_STRIPE_PRICE_BUSINESS=price_...
   ```
4. Set up webhook: `https://yourdomain.com/api/webhooks/stripe`
5. Enable events: `checkout.session.completed`, `invoice.payment_succeeded`

### 3. Database Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Deploy
```bash
vercel --prod
```

### 5. Verify
1. Visit: `https://yourdomain.com/api/health` → Should return 200
2. Visit: `https://yourdomain.com/saas` → Landing page
3. Test signup → Should work!

## ✅ That's It!

Your SaaS is live! 🎉

---

**Need Help?** See `PRODUCTION_DEPLOYMENT_CHECKLIST.md` for detailed guide.

