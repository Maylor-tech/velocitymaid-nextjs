# Customer Portal Phase 2 - Setup Guide

## Overview

Phase 2 adds advanced billing, subscriptions, tips, and loyalty features to the Customer Portal with full Stripe integration.

## Features

- **Billing Management**: View payment methods, invoices, and access Stripe Billing Portal
- **Subscriptions**: Start and manage recurring cleaning plans (weekly, bi-weekly, monthly)
- **Tips**: Tip cleaners after completed jobs via Stripe Checkout
- **Loyalty Points**: Track and display loyalty points earned from jobs and tips

## Environment Variables

Add to `.env.local`:

```bash
# Existing
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# New for Phase 2
STRIPE_PRICE_WEEKLY=price_...      # Price ID for weekly subscription
STRIPE_PRICE_BIWEEKLY=price_...    # Price ID for bi-weekly subscription
STRIPE_PRICE_MONTHLY=price_...     # Price ID for monthly subscription
STRIPE_BILLING_PORTAL_RETURN_URL=https://velocitymaid.com/customer/billing
```

## Stripe Setup

### 1. Create Subscription Prices

In Stripe Dashboard:
1. Go to Products → Create Product
2. Create three products:
   - **Weekly Clean Plan** → Create price (recurring, weekly)
   - **Bi-weekly Refresh** → Create price (recurring, every 2 weeks)
   - **Monthly Deep Care** → Create price (recurring, monthly)
3. Copy Price IDs to environment variables

### 2. Enable Billing Portal

1. Go to Settings → Billing → Customer Portal
2. Configure portal settings:
   - Allow customers to update payment methods
   - Allow customers to view invoices
   - Set return URL: `https://velocitymaid.com/customer/billing`
3. Enable portal

### 3. Webhook Setup (TODO)

Configure webhooks for:
- `checkout.session.completed` - Update subscription/tip status
- `customer.subscription.updated` - Sync subscription status
- `invoice.payment_succeeded` - Update loyalty points
- `payment_intent.succeeded` - Update tip status

## Data Models

### Customer (Extended)

```typescript
{
  stripeCustomerId: string | null;
  loyaltyPoints: number; // Default: 0
}
```

### CustomerSubscription

```typescript
{
  id: string;
  customerId: string;
  stripeSubscriptionId: string;
  planType: 'weekly' | 'biweekly' | 'monthly';
  serviceLocation: 'new_jersey' | 'vermont';
  defaultServiceType: 'basic' | 'deep' | 'moveInOut';
  defaultAddOns: string[];
  status: 'active' | 'paused' | 'canceled' | 'past_due' | 'trialing';
  nextBillingDate: string | null;
}
```

### Tip

```typescript
{
  id: string;
  jobId: string;
  cleanerId: string;
  customerId: string;
  tipAmount: number;
  stripePaymentIntentId: string | null;
  status: 'pending' | 'paid' | 'failed';
}
```

## Routes

### Frontend Pages

- `/customer/billing` - Billing summary and portal access
- `/customer/subscriptions` - Manage subscriptions
- `/customer/tips` - Tip cleaners

### API Endpoints

**Billing:**
- `GET /api/customer/billing/summary` - Get billing summary
- `POST /api/customer/billing/portal` - Create billing portal session

**Subscriptions:**
- `GET /api/customer/subscriptions` - Get current subscription
- `POST /api/customer/subscriptions/create` - Create subscription checkout
- `PATCH /api/customer/subscriptions/update` - Update subscription (cancel/pause/resume)

**Tips:**
- `GET /api/customer/tips/eligible-jobs` - Get jobs that can be tipped
- `POST /api/customer/tips/create-checkout-session` - Create tip checkout

## Loyalty Points System

### Points Earned

- **Basic Clean**: 10 points
- **Deep Clean**: 15 points
- **Move In/Out**: 20 points
- **Tips**: 5 points per $10 tier

### Integration Points

**Job Completion:**
```typescript
// When job status = "completed"
import { addPointsForCompletedJob } from '@/utils/loyaltyEngine';
addPointsForCompletedJob(customerId, job);
```

**Tip Payment:**
```typescript
// When tip payment succeeds (via webhook)
import { addPointsForTip } from '@/utils/loyaltyEngine';
addPointsForTip(customerId, tipAmount);
```

## Webhook Integration (TODO)

### Subscription Webhook

```typescript
// /api/webhooks/stripe
// Event: customer.subscription.created
// - Create CustomerSubscription record
// - Set status to 'active'

// Event: customer.subscription.updated
// - Update CustomerSubscription status
// - Update nextBillingDate

// Event: customer.subscription.deleted
// - Set status to 'canceled'
```

### Tip Webhook

```typescript
// Event: checkout.session.completed
// - Check metadata.type === 'tip'
// - Update tip status to 'paid'
// - Set stripePaymentIntentId
// - Call addPointsForTip()
```

### Invoice Webhook

```typescript
// Event: invoice.payment_succeeded
// - Could trigger loyalty points for subscription payments (future)
```

## Database Migration

### Customer Table

```sql
ALTER TABLE customers
ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE,
ADD COLUMN loyalty_points INTEGER DEFAULT 0;

CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id);
```

### Customer Subscriptions Table

```sql
CREATE TABLE customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('weekly', 'biweekly', 'monthly')),
  service_location VARCHAR(20) NOT NULL CHECK (service_location IN ('new_jersey', 'vermont')),
  default_service_type VARCHAR(20) NOT NULL CHECK (default_service_type IN ('basic', 'deep', 'moveInOut')),
  default_add_ons TEXT[],
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'paused', 'canceled', 'past_due', 'trialing')),
  next_billing_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_subscriptions_customer ON customer_subscriptions(customer_id);
CREATE INDEX idx_subscriptions_stripe ON customer_subscriptions(stripe_subscription_id);
```

### Tips Table

```sql
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) NOT NULL,
  cleaner_id VARCHAR(255) NOT NULL,
  customer_id UUID NOT NULL,
  tip_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_tips_customer ON tips(customer_id);
CREATE INDEX idx_tips_job ON tips(job_id);
CREATE INDEX idx_tips_cleaner ON tips(cleaner_id);
```

## Testing

### Test Billing Portal

1. Login to customer portal
2. Navigate to `/customer/billing`
3. Click "Manage Payment Methods & Billing"
4. Should redirect to Stripe Billing Portal
5. After making changes, should return to billing page

### Test Subscription

1. Navigate to `/customer/subscriptions`
2. Click "Start Plan" on a plan
3. Complete Stripe Checkout
4. Should redirect back with success status
5. Subscription should appear in list

### Test Tips

1. Complete a job (mark as completed)
2. Navigate to `/customer/tips`
3. Click "Tip Cleaner" on a job
4. Select tip amount
5. Complete Stripe Checkout
6. Should redirect back with success status
7. Job should show "Already Tipped"

## Future Enhancements

1. **Loyalty Redemption**
   - Allow customers to redeem points for discounts
   - Points → discount conversion
   - Apply to future bookings

2. **Subscription Modifications**
   - Change plan type
   - Update service preferences
   - Skip next cleaning

3. **Tip History**
   - View all tips given
   - Tip analytics
   - Favorite cleaners

4. **Subscription Benefits**
   - Priority scheduling
   - Bonus loyalty points
   - Exclusive discounts




