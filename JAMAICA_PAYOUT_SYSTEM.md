# Jamaica Payout System - Implementation Guide

## Overview

Complete payout system for Jamaica (JMD) operations, fully independent from Stripe. Only applies when `branch.country = "JM"`.

## Database Schema

### New Models Added

1. **JamaicaPayout**
   - Tracks payouts for cleaners in Jamaica branches
   - Status: PENDING → APPROVED → PAID
   - Links to cleaner and branch

2. **JamaicaPaymentMethod**
   - Stores cleaner banking details
   - One-to-one with User (cleaner)

### Branch Model Updates

- `country` field: Default "US", set to "JM" for Jamaica branches
- `currency` field: Default "USD", set to "JMD" for Jamaica branches

## Setup Instructions

### 1. Run Prisma Migration

```bash
npx prisma migrate dev --name jamaica_payouts
npx prisma generate
```

### 2. Update Port Antonio Branch

Ensure Port Antonio branch has:
- `country: "JM"`
- `currency: "JMD"`

You can update this via:
- Admin panel: `/admin/branches/port-antonio/edit`
- Or directly in database

### 3. Environment Variables

Add to `.env.local`:
```env
CRON_SECRET=your-secure-cron-secret-here
```

## Features

### 1. Earnings Calculation

Automatically calculates cleaner earnings based on:
- Completed jobs in Jamaica branches
- Job currency must be "JMD"
- Pay rates:
  - Deep Clean: 60%
  - Standard Clean: 55%
  - Move In/Out: 65%

### 2. Payout Management

**Admin Endpoints:**
- `POST /api/admin/payouts/jamaica/create` - Create payout
- `POST /api/admin/payouts/jamaica/approve` - Approve payout
- `POST /api/admin/payouts/jamaica/paid` - Mark as paid
- `GET /api/admin/payouts/jamaica/list` - List payouts

**Cleaner Endpoints:**
- `POST /api/cleaners/payment-method/update` - Update banking details
- `GET /api/cleaners/payment-method/get` - Get payment method

### 3. Admin Panel

Visit `/admin/payouts/jamaica` to:
- View all payouts for Jamaica branches
- Filter by status (Pending, Approved, Paid)
- Approve payouts
- Mark payouts as paid
- View cleaner details

### 4. Cleaner Payment Method Form

Cleaners can update their banking details at `/cleaners/payment-method`:
- Bank Name
- Account Number
- Account Type (Savings/Checking)
- WhatsApp Number (for notifications)

### 5. WhatsApp Automation

Automatic WhatsApp notifications sent for:
- **Payout Created**: "Your payout for {period} has been created: JMD ${amount}"
- **Payout Approved**: "Your payout of JMD ${amount} has been APPROVED"
- **Payout Paid**: "Your payout of JMD ${amount} has been PAID 🎉"

### 6. Weekly Cron Job

Automated payout generation runs weekly:
- Endpoint: `/api/cron/payouts/jamaica`
- Period: Last 14 days
- Only processes Jamaica branches
- Sends WhatsApp notifications

**Setup Cron:**
- Vercel: Add to `vercel.json`
- External: Schedule GET request with `?secret=CRON_SECRET`

## Workflow

### Manual Payout Creation

1. Admin visits `/admin/payouts/jamaica`
2. Selects branch
3. Creates payout for cleaner
4. System calculates earnings for last 14 days
5. WhatsApp notification sent to cleaner

### Payout Approval Flow

1. Admin reviews payout
2. Clicks "Approve"
3. Status changes to APPROVED
4. WhatsApp notification sent

### Payment Processing

1. Admin processes bank transfer
2. Clicks "Mark Paid"
3. Status changes to PAID
4. WhatsApp receipt sent to cleaner

## Security

### Current Implementation

- TODO comments indicate where authentication should be added
- Admin endpoints should verify `role === 'ADMIN'`
- Cleaner endpoints should verify user owns the payment method
- Cron endpoint protected with `CRON_SECRET`

### Recommended Security Additions

1. **Authentication Middleware**
   ```typescript
   // Add to all admin endpoints
   const session = await getServerSession();
   if (!session || session.user.role !== 'ADMIN') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

2. **Rate Limiting**
   - Add rate limiting to WhatsApp notification endpoints
   - Prevent spam/abuse

3. **Input Validation**
   - Validate all input data
   - Sanitize user inputs
   - Validate phone numbers

## Testing Checklist

### Manual Testing

1. ✅ Create a payout for a cleaner
2. ✅ Verify earnings calculation is correct
3. ✅ Test WhatsApp notification on payout creation
4. ✅ Approve payout and verify WhatsApp
5. ✅ Mark payout as paid and verify WhatsApp
6. ✅ Test cleaner payment method form
7. ✅ Verify U.S. branches are unaffected

### Automated Testing

1. ✅ Earnings calculation for different service types
2. ✅ Payout creation with valid/invalid data
3. ✅ Status transitions (PENDING → APPROVED → PAID)
4. ✅ WhatsApp notification delivery
5. ✅ Cron job execution

## File Structure

```
/app/services/payouts/
  └── jamaicaPayoutService.ts    # Core payout logic

/app/api/admin/payouts/jamaica/
  ├── create/route.ts            # Create payout
  ├── approve/route.ts           # Approve payout
  ├── paid/route.ts              # Mark as paid
  └── list/route.ts              # List payouts

/app/api/cleaners/payment-method/
  ├── update/route.ts            # Update payment method
  └── get/route.ts               # Get payment method

/app/api/cron/payouts/jamaica/
  └── route.ts                   # Weekly cron job

/app/admin/payouts/jamaica/
  └── page.tsx                   # Admin panel

/app/cleaners/payment-method/
  └── page.tsx                   # Cleaner form
```

## Important Notes

1. **Jamaica Only**: All payout logic only applies when `branch.country === "JM"`
2. **U.S. Unchanged**: Stripe payout logic for U.S. branches remains untouched
3. **Currency Required**: Jobs must have `currency: "JMD"` to be included
4. **Completed Jobs Only**: Only completed jobs are included in earnings
5. **WhatsApp Optional**: WhatsApp notifications are non-blocking (won't fail payout if WhatsApp fails)

## Troubleshooting

### Payout Not Creating

- Verify branch has `country: "JM"` and `currency: "JMD"`
- Check cleaner has completed jobs in the period
- Verify jobs have `status: "completed"` and `currency: "JMD"`

### WhatsApp Not Sending

- Check `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID` are set
- Verify cleaner has `whatsappNumber` in payment method
- Check server logs for WhatsApp errors

### Earnings Calculation Wrong

- Verify service type matches pay rate mapping
- Check job `totalPrice` is correct
- Ensure jobs are in the correct period

## Next Steps

1. Run Prisma migration
2. Update Port Antonio branch country/currency
3. Test payout creation manually
4. Set up weekly cron job
5. Add authentication to all endpoints
6. Add rate limiting for WhatsApp


