# Demo Mode Setup Guide

## Overview

Demo Mode allows you to safely test payout operations without making real payments. When `DEMO_MODE=true`, all payout execution operations are simulated and no real database changes are made.

## Environment Setup

Add to your `.env.local` file:

```bash
DEMO_MODE=true
```

**IMPORTANT:** Never set `DEMO_MODE=true` in production environments.

## Features

### 1. **Safety Checks**
- All payout execution routes check `DEMO_MODE` before making real changes
- When enabled, operations return simulated success responses
- No real database updates occur for payout status changes

### 2. **Visual Indicators**
- Yellow banner appears at the top of admin pages when demo mode is active
- Status badges show "(DEMO)" indicator for simulated PAID/FAILED/SENT states
- Clear messaging that operations are simulated

### 3. **Protected Routes**
The following routes are protected in demo mode:
- `POST /api/admin/payouts/[payoutId]/execute` - Single payout execution
- `POST /api/admin/payouts/[payoutId]/confirm-paid` - Single payout confirmation
- `POST /api/admin/payouts/settle` - Bulk payout settlement
- `POST /api/admin/payouts/bulk/execute` - Bulk payout execution
- `POST /api/admin/payouts/bulk/confirm-paid` - Bulk payout confirmation

### 4. **Demo Reset API**
- `POST /api/admin/demo/reset` - Wipes all payouts and resets job statuses
- **Only works when `DEMO_MODE=true`**
- Requires ADMIN authentication
- Returns summary of deleted records

## Usage

### Enable Demo Mode
1. Set `DEMO_MODE=true` in `.env.local`
2. Restart your Next.js dev server
3. The yellow banner will appear automatically

### Test Payout Operations
1. Navigate to `/admin/payouts`
2. Execute, confirm, or settle payouts as normal
3. Operations will be simulated (no real changes)
4. Status badges will show "(DEMO)" indicator

### Reset Demo Data
```bash
curl -X POST http://localhost:3000/api/admin/demo/reset \
  -H "Content-Type: application/json" \
  -H "x-admin-id: YOUR_ADMIN_ID" \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

Or use the browser console:
```javascript
fetch('/api/admin/demo/reset', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-id': localStorage.getItem('adminId')
  }
})
.then(r => r.json())
.then(data => console.log('Reset result:', data));
```

## Production Safety

- **Never** set `DEMO_MODE=true` in production
- The demo reset API will return 403 if `DEMO_MODE` is not enabled
- All safety checks are server-side only
- Client-side indicators are for UX only

## Code Structure

- `lib/demoMode.ts` - Core utility functions
- `components/DemoModeBanner.tsx` - Visual banner component
- `app/api/admin/demo/status/route.ts` - Status endpoint for client-side
- `app/api/admin/demo/reset/route.ts` - Reset endpoint
- Safety checks added to all payout execution routes

## Testing Checklist

- [ ] Banner appears when `DEMO_MODE=true`
- [ ] Payout execution returns simulated success
- [ ] Status badges show "(DEMO)" indicator
- [ ] No real database changes occur
- [ ] Demo reset API works correctly
- [ ] Production behavior unchanged when `DEMO_MODE=false`
















