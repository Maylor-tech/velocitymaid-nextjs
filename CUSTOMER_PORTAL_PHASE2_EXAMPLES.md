# Customer Portal Phase 2 - Examples & Outputs

## Example Data

### Customer with Stripe

```typescript
{
  id: "customer_123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+19731234567",
  stripeCustomerId: "cus_abc123xyz",
  loyaltyPoints: 45,
  region: "new_jersey"
}
```

### Subscription

```typescript
{
  id: "sub_123",
  customerId: "customer_123",
  stripeSubscriptionId: "sub_abc123xyz",
  planType: "biweekly",
  serviceLocation: "new_jersey",
  defaultServiceType: "deep",
  defaultAddOns: ["windows", "oven"],
  status: "active",
  nextBillingDate: "2025-01-15",
  currentPeriodEnd: "2025-01-15T00:00:00Z"
}
```

### Tip

```typescript
{
  id: "tip_123",
  jobId: "cs_test_abc123",
  cleanerId: "cleaner_1",
  customerId: "customer_123",
  tipAmount: 20.00,
  stripePaymentIntentId: "pi_abc123xyz",
  status: "paid",
  createdAt: "2024-12-26T10:00:00Z",
  paidAt: "2024-12-26T10:05:00Z"
}
```

## API Request/Response Examples

### Billing Summary

```bash
GET /api/customer/billing/summary
```

**Response:**
```json
{
  "success": true,
  "paymentMethodSummary": {
    "id": "pm_abc123",
    "brand": "visa",
    "last4": "4242",
    "expMonth": 12,
    "expYear": 2025
  },
  "recentInvoices": [
    {
      "id": "in_abc123",
      "amountPaid": 120.00,
      "amountDue": 0,
      "status": "paid",
      "hostedInvoiceUrl": "https://invoice.stripe.com/i/...",
      "created": "2024-12-15T10:00:00Z",
      "description": "Bi-weekly Clean Plan"
    }
  ],
  "stripeCustomerId": "cus_abc123xyz"
}
```

### Create Subscription

```bash
POST /api/customer/subscriptions/create
{
  "planType": "biweekly",
  "serviceLocation": "new_jersey",
  "defaultServiceType": "deep",
  "defaultAddOns": ["windows"]
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_abc123"
}
```

### Get Subscription

```bash
GET /api/customer/subscriptions
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "planType": "biweekly",
    "serviceLocation": "new_jersey",
    "defaultServiceType": "deep",
    "defaultAddOns": ["windows"],
    "status": "active",
    "nextBillingDate": "2025-01-15",
    "stripeStatus": "active",
    "currentPeriodEnd": "2025-01-15T00:00:00Z"
  }
}
```

### Cancel Subscription

```bash
PATCH /api/customer/subscriptions/update
{
  "action": "cancel"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "status": "canceled",
    "nextBillingDate": "2025-01-15"
  },
  "message": "Subscription cancelled successfully"
}
```

### Get Eligible Jobs for Tips

```bash
GET /api/customer/tips/eligible-jobs
```

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "jobId": "cs_test_abc123",
      "date": "2024-12-20",
      "serviceType": "deep",
      "cleanerName": "Jane Cleaner",
      "cleanerId": "cleaner_1",
      "address": "123 Main St, Newark, NJ",
      "alreadyTipped": false,
      "tipAmount": null
    }
  ],
  "count": 1
}
```

### Create Tip Checkout

```bash
POST /api/customer/tips/create-checkout-session
{
  "jobId": "cs_test_abc123",
  "cleanerId": "cleaner_1",
  "tipAmount": 20
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_tip_abc123",
  "tipId": "tip_123"
}
```

## Loyalty Points Examples

### Points Calculation

```typescript
// Basic clean completed
addPointsForCompletedJob(customerId, {
  serviceType: 'basic',
  // ... other job fields
});
// Result: +10 points

// Deep clean completed
addPointsForCompletedJob(customerId, {
  serviceType: 'deep',
  // ...
});
// Result: +15 points

// $20 tip paid
addPointsForTip(customerId, 20);
// Result: +10 points (2 tiers × 5 points)
```

### Points Display

```typescript
// Dashboard shows:
"Loyalty Points: 45"
"Redeem on future cleans (coming soon)"
```

## UI Preview

### Billing Page

```
┌─────────────────────────────────────────────────────────┐
│  Billing                                                 │
│  Manage your payment information and invoices          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Billing Summary                                        │
│                                                         │
│  📧 Email: john.doe@example.com                          │
│  💳 Primary Payment Method                              │
│     Visa •••• 4242                                      │
│     Expires 12/2025                                     │
│                                                         │
│  [Manage Payment Methods & Billing] → Stripe Portal    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Recent Invoices                                        │
├─────────────────────────────────────────────────────────┤
│  Date        Description        Amount    Status       │
│  Dec 15      Bi-weekly Plan     $120.00   Paid         │
│  Nov 15      Bi-weekly Plan     $120.00   Paid         │
└─────────────────────────────────────────────────────────┘
```

### Subscriptions Page

```
┌─────────────────────────────────────────────────────────┐
│  Subscriptions                                          │
│                                                         │
│  Bi-weekly Refresh [New Jersey] [Active]                │
│                                                         │
│  📅 Next Billing Date: January 15, 2025                │
│  Default Service: Deep                                 │
│  Add-ons: [Windows] [Oven]                              │
│                                                         │
│  [Manage Billing] [Cancel Subscription]                 │
└─────────────────────────────────────────────────────────┘
```

### Tips Page

```
┌─────────────────────────────────────────────────────────┐
│  Tips                                                   │
│  Thank you for supporting your cleaners!               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Deep Clean                    [Tip Cleaner]            │
│  📅 December 20, 2024                                   │
│  📍 123 Main St, Newark, NJ                            │
│  Cleaner: Jane Cleaner                                  │
└─────────────────────────────────────────────────────────┘

[Tip Modal]
┌─────────────────────────────────────────────────────────┐
│  Tip Your Cleaner                                       │
│                                                         │
│  Service: Deep Clean                                    │
│  Cleaner: Jane Cleaner                                  │
│  Date: December 20, 2024                               │
│                                                         │
│  Select Tip Amount:                                     │
│  [$5]  [$10]  [$20]                                    │
│                                                         │
│  Custom Amount: $___                                    │
│                                                         │
│  Tip Amount: $20.00                                     │
│                                                         │
│  [Pay Tip Securely] [Cancel]                           │
└─────────────────────────────────────────────────────────┘
```

## Webhook Payload Examples

### Subscription Created

```json
{
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_abc123xyz",
      "customer": "cus_abc123xyz",
      "status": "active",
      "current_period_end": 1736899200,
      "metadata": {
        "customerId": "customer_123",
        "planType": "biweekly",
        "serviceLocation": "new_jersey"
      }
    }
  }
}
```

### Tip Payment Succeeded

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_tip_abc123",
      "customer": "cus_abc123xyz",
      "payment_status": "paid",
      "metadata": {
        "type": "tip",
        "jobId": "cs_test_abc123",
        "cleanerId": "cleaner_1",
        "tipAmount": "20"
      }
    }
  }
}
```



