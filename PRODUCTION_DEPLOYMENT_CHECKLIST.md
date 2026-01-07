# Production Deployment Checklist

## ✅ Pre-Deployment

### 1. Environment Variables
- [ ] `DATABASE_URL` - Production database connection string
- [ ] `DIRECT_URL` - Direct database connection (for migrations)
- [ ] `STRIPE_SECRET_KEY` - Production Stripe secret key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret (starts with `whsec_`)
- [ ] `NEXTAUTH_URL` - Production app URL (e.g., `https://app.velocitymaid.com`)
- [ ] `NEXT_PUBLIC_APP_URL` - Public app URL (same as above)
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_STARTER` - Stripe Price ID for Starter plan
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_PRO` - Stripe Price ID for Pro plan
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS` - Stripe Price ID for Business plan

### 2. Database
- [ ] Run production migration: `npx prisma migrate deploy`
- [ ] Verify all tables exist: `Tenant`, `Subscription`, `User` (with `tenantId`)
- [ ] Test database connection from production environment
- [ ] Set up database backups

### 3. Stripe Configuration
- [ ] Switch to live mode in Stripe Dashboard
- [ ] Create three pricing plans:
  - Starter: $99/month
  - Pro: $199/month
  - Business: $399/month
- [ ] Copy Price IDs to environment variables
- [ ] Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Configure webhook events:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
- [ ] Test webhook with Stripe CLI or test events

### 4. Code Quality
- [ ] Run `npm run build` - verify no build errors
- [ ] Run `npm run lint` - fix any linting errors
- [ ] Test all API endpoints locally
- [ ] Verify TypeScript compilation: `npx tsc --noEmit`

### 5. Security
- [ ] Verify all API routes have authentication where needed
- [ ] Check that session cookies use `secure: true` in production
- [ ] Verify CORS settings if needed
- [ ] Review error messages (don't expose sensitive info)
- [ ] Check that Stripe webhook signature verification is enabled

## 🚀 Deployment Steps

### 1. Vercel Deployment (Recommended)
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod
```

### 2. Environment Variables in Vercel
- [ ] Add all environment variables in Vercel dashboard
- [ ] Verify `NODE_ENV=production` is set automatically
- [ ] Test environment variable access

### 3. Database Migration
```bash
# Run migrations in production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 4. Post-Deployment Verification
- [ ] Visit `/api/health` - should return 200 OK
- [ ] Test signup flow: `/saas/signup`
- [ ] Test login flow: `/saas/login`
- [ ] Test dashboard: `/saas/dashboard`
- [ ] Test billing page: `/saas/billing`
- [ ] Test Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Verify webhook receives events

## 🔍 Production Monitoring

### 1. Health Checks
- [ ] Set up monitoring for `/api/health` endpoint
- [ ] Configure alerts for health check failures
- [ ] Monitor database connection
- [ ] Monitor Stripe API calls

### 2. Logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor API request logs
- [ ] Track registration/login success rates
- [ ] Monitor Stripe webhook delivery

### 3. Performance
- [ ] Monitor API response times
- [ ] Check database query performance
- [ ] Monitor Stripe API latency
- [ ] Set up performance alerts

## 🧪 Testing Checklist

### API Endpoints
- [ ] `POST /api/saas/register` - Registration with valid data
- [ ] `POST /api/saas/register` - Registration with duplicate email (should fail)
- [ ] `POST /api/saas/register` - Registration with invalid email (should fail)
- [ ] `POST /api/saas/login` - Login with valid email
- [ ] `POST /api/saas/login` - Login with invalid email (should fail)
- [ ] `GET /api/saas/me` - Get current user (requires auth)
- [ ] `POST /api/saas/logout` - Logout
- [ ] `POST /api/billing/create-checkout-session` - Create checkout (requires auth)
- [ ] `GET /api/health` - Health check

### User Flows
- [ ] Complete signup → dashboard flow
- [ ] Login → dashboard flow
- [ ] Dashboard → billing → checkout flow
- [ ] Webhook updates subscription after payment

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` is correct
   - Verify database is accessible from production
   - Check firewall rules

2. **Stripe Errors**
   - Verify using live keys (not test keys)
   - Check webhook endpoint is accessible
   - Verify webhook secret matches

3. **Session Issues**
   - Check cookie settings (secure, sameSite)
   - Verify domain settings
   - Check CORS if using subdomain

4. **Build Errors**
   - Run `npx prisma generate` before build
   - Check all environment variables are set
   - Verify TypeScript compilation

## 📊 Success Metrics

After deployment, monitor:
- [ ] Registration success rate
- [ ] Login success rate
- [ ] Checkout completion rate
- [ ] Webhook delivery success rate
- [ ] API response times
- [ ] Error rates

## 🔄 Rollback Plan

If issues occur:
1. Revert to previous deployment in Vercel
2. Check database for any partial data
3. Review error logs
4. Fix issues in development
5. Re-deploy after testing

## ✅ Final Checklist

- [ ] All environment variables set
- [ ] Database migrated
- [ ] Stripe configured
- [ ] Health check passing
- [ ] All user flows tested
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Documentation updated

---

**Ready for Production!** 🚀

