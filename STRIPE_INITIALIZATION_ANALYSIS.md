# Stripe Initialization Analysis

**Date:** December 28, 2024  
**Status:** Multiple initialization patterns found

---

## 📋 Summary

Your codebase uses **3 different patterns** for Stripe initialization:

1. **Lazy initialization with validation** (Recommended) - Used in `app/api/checkout/route.ts`
2. **Lazy initialization without validation** - Used in `app/api/booking/create/route.ts` and others
3. **Module-level initialization** (Problematic) - Used in `utils/stripe.ts`

---

## 🔍 Pattern 1: Lazy Initialization with Validation (BEST)

**Location:** `app/api/checkout/route.ts`

```typescript
// Initialize Stripe only when needed (lazy initialization)
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables. Please create a .env.local file with your Stripe secret key (starts with sk_test_ or sk_live_).');
  }
  // Check if it's a publishable key (common mistake)
  if (secretKey.startsWith('pk_')) {
    throw new Error('You are using a PUBLISHABLE key (pk_...). Please use a SECRET key (sk_test_... or sk_live_...) instead. Get your secret key from https://dashboard.stripe.com/test/apikeys');
  }
  // Check if it's a valid secret key format
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format. Secret keys should start with sk_test_ (for testing) or sk_live_ (for production).');
  }
  return new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });
}
```

**Environment Variable:** `STRIPE_SECRET_KEY`

**API Version:** `"2024-06-20"`

**Pros:**
- ✅ Lazy initialization (only creates when needed)
- ✅ Comprehensive validation
- ✅ Clear error messages
- ✅ Prevents build-time errors

**Cons:**
- ❌ API version is different from other files

---

## 🔍 Pattern 2: Lazy Initialization (Simple)

**Location:** `app/api/booking/create/route.ts`

```typescript
// Initialize Stripe
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}
```

**Environment Variable:** `STRIPE_SECRET_KEY`

**API Version:** `'2025-10-29.clover'`

**Pros:**
- ✅ Lazy initialization
- ✅ Simple and clean

**Cons:**
- ❌ No validation for publishable key mistake
- ❌ API version mismatch with checkout route
- ❌ Less helpful error messages

**Also used in:**
- `app/api/webhooks/stripe/route.ts`
- `app/api/reviews/create/route.ts`
- `app/api/customer/bookings/update/route.ts`
- `app/api/customer/bookings/cancel/route.ts`
- `app/api/cron/reminder-24h/route.ts`
- `app/api/bookings/assign-cleaner/route.ts`
- `utils/cleanerScorecardQueries.ts`
- `utils/payoutEngine.ts`
- `utils/customerBookings.ts`
- `app/api/reviews/job/[jobId]/route.ts`
- `utils/branchProfitQueries.ts`
- `utils/dashboardQueries.ts`

---

## 🔍 Pattern 3: Module-Level Initialization (PROBLEMATIC)

**Location:** `utils/stripe.ts`

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
});

export default stripe;
```

**Environment Variable:** `STRIPE_SECRET_KEY`

**API Version:** `'2025-10-29.clover'`

**Pros:**
- ✅ Centralized initialization
- ✅ Single instance

**Cons:**
- ❌ **Module-level execution** - Can cause build-time errors
- ❌ **No validation** for publishable key
- ❌ **Runs at import time** - Not safe for serverless
- ❌ API version mismatch

**Used in:**
- `utils/getOrCreateStripeCustomerForCustomer.ts`

---

## ⚠️ Issues Found

### 1. **API Version Mismatch**

| File | API Version |
|------|-------------|
| `app/api/checkout/route.ts` | `"2024-06-20"` |
| `app/api/booking/create/route.ts` | `'2025-10-29.clover'` |
| `utils/stripe.ts` | `'2025-10-29.clover'` |
| `app/api/webhooks/stripe/route.ts` | `'2025-10-29.clover'` |

**Problem:** Different API versions can cause inconsistent behavior.

**Recommendation:** Standardize on one API version (preferably `"2024-06-20"` which is a stable version).

---

### 2. **Module-Level Initialization in `utils/stripe.ts`**

**Problem:** This file initializes Stripe at module load time, which can cause:
- Build-time errors if `STRIPE_SECRET_KEY` is missing
- Issues with Next.js serverless functions
- No lazy initialization benefits

**Recommendation:** Convert to lazy initialization pattern.

---

### 3. **Inconsistent Validation**

**Files with validation:**
- ✅ `app/api/checkout/route.ts` - Full validation (publishable key check, format check)

**Files without validation:**
- ❌ `app/api/booking/create/route.ts` - No publishable key check
- ❌ `utils/stripe.ts` - No validation at all
- ❌ Most other files - No validation

**Recommendation:** Add validation to all `getStripe()` functions.

---

## ✅ Recommended Standard Pattern

**Create a shared utility:**

```typescript
// lib/stripe/getStripe.ts
import Stripe from 'stripe';

/**
 * Get Stripe instance with validation
 * Uses lazy initialization to prevent build-time errors
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set in environment variables. ' +
      'Please set it in your .env.local file or Vercel environment variables.'
    );
  }
  
  // Check if it's a publishable key (common mistake)
  if (secretKey.startsWith('pk_')) {
    throw new Error(
      'You are using a PUBLISHABLE key (pk_...). ' +
      'Please use a SECRET key (sk_test_... or sk_live_...) instead. ' +
      'Get your secret key from https://dashboard.stripe.com/test/apikeys'
    );
  }
  
  // Check if it's a valid secret key format
  if (!secretKey.startsWith('sk_')) {
    throw new Error(
      'Invalid Stripe secret key format. ' +
      'Secret keys should start with sk_test_ (for testing) or sk_live_ (for production).'
    );
  }
  
  return new Stripe(secretKey, {
    apiVersion: "2024-06-20", // Standardize on this version
  });
}
```

**Then import it everywhere:**
```typescript
import { getStripe } from '@/lib/stripe/getStripe';

// In your route handler:
const stripe = getStripe();
```

---

## 📊 Current Usage Summary

| Pattern | Files Using It | Status |
|---------|----------------|--------|
| Lazy with validation | 1 file | ✅ Best |
| Lazy without validation | ~15 files | ⚠️ Good but inconsistent |
| Module-level | 1 file | ❌ Problematic |

---

## 🔧 Environment Variables Required

**All Stripe initializations use:**
- `STRIPE_SECRET_KEY` - Required (starts with `sk_test_` or `sk_live_`)

**Optional (used in some files):**
- `STRIPE_WEBHOOK_SECRET` - For webhook verification
- `STRIPE_PRICE_WEEKLY` - For subscriptions
- `STRIPE_PRICE_BIWEEKLY` - For subscriptions
- `STRIPE_PRICE_MONTHLY` - For subscriptions
- `STRIPE_BILLING_PORTAL_RETURN_URL` - For billing portal

---

## 🎯 Next Steps

1. **Standardize API version** - Use `"2024-06-20"` everywhere
2. **Create shared utility** - `lib/stripe/getStripe.ts` with full validation
3. **Update all files** - Replace individual `getStripe()` functions with shared utility
4. **Fix `utils/stripe.ts`** - Convert to lazy initialization or remove if unused









