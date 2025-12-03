# Cleaner Portal Setup Guide

## Overview

The Cleaner Portal allows cleaners to securely view their assigned jobs, update job status, and manage their schedule for both New Jersey and Vermont regions.

## Features

- **Simple Login**: Phone/email-based authentication
- **Job Management**: View and update job status
- **Schedule View**: Today's jobs, upcoming, and completed
- **Region Support**: Works for both NJ and VT cleaners
- **Status Updates**: Mark jobs as "On The Way" or "Completed"

## Routes

### Frontend Pages

- `/cleaners/login` - Login page
- `/cleaners/dashboard` - Main dashboard (protected)

### API Endpoints

- `POST /api/cleaners/login` - Authenticate cleaner
- `DELETE /api/cleaners/login` - Logout
- `GET /api/cleaners/me` - Get current cleaner info
- `GET /api/cleaners/jobs` - Get cleaner's jobs
- `PATCH /api/cleaners/jobs` - Update job status

## Authentication

### Current Implementation

- Uses HTTP-only cookies for session management
- Cookie name: `cleanerId`
- Expires: 7 days
- Secure in production (HTTPS only)

### Login Flow

1. Cleaner enters phone number or email
2. System checks if cleaner exists
3. If found, sets `cleanerId` cookie
4. Redirects to dashboard

### Mock Cleaners

For testing, the following cleaners are available:

```typescript
// New Jersey
Phone: +19735556677
Email: john.cleaner@velocitymaid.com

// Vermont
Phone: +18025556677
Email: jane.cleaner@velocitymaid.com

// New Jersey
Phone: +19734445555
Email: bob.cleaner@velocitymaid.com
```

## Data Model

### Cleaner

```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  region: 'new_jersey' | 'vermont';
  active: boolean;
}
```

### Job

```typescript
{
  id: string;
  sessionId: string;
  customerName: string;
  address: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  serviceLocation: 'new_jersey' | 'vermont';
  status: 'pending' | 'assigned' | 'confirmed' | 'on_the_way' | 'completed' | 'cancelled';
  assignedCleanerId: string;
  specialInstructions?: string;
  phone?: string;
  email?: string;
  totalPrice?: number;
}
```

## Job Status Flow

```
pending → assigned → confirmed → on_the_way → completed
                                    ↓
                                cancelled
```

## Testing

### 1. Login

Navigate to: `http://localhost:3000/cleaners/login`

Use test credentials:
- Phone: `+19735556677` (John Cleaner - NJ)
- Phone: `+18025556677` (Jane Cleaner - VT)

### 2. View Jobs

After login, you'll see:
- **Today's Jobs**: Jobs scheduled for today
- **Upcoming**: Future jobs
- **Completed**: Past completed jobs

### 3. Update Status

- Click "Mark as On The Way" for confirmed jobs
- Click "Mark as Completed" for jobs in progress

## Integration with Existing System

### Stripe Integration

The portal reads jobs from Stripe Checkout Sessions:
- Matches jobs by `assignedCleanerPhone` in metadata
- Updates job status in Stripe metadata
- No separate database required (for now)

### Assignment Flow

1. Admin assigns cleaner via `/api/bookings/assign-cleaner`
2. Stripe metadata updated with `assignedCleanerPhone`
3. Cleaner can see job in portal
4. Cleaner updates status
5. Status saved back to Stripe metadata

## Security

### Route Protection

- Dashboard checks for `cleanerId` cookie
- If missing, redirects to login
- API routes validate cookie before processing

### Job Ownership

- Before updating job status, system verifies:
  - Job's `assignedCleanerPhone` matches cleaner's phone
  - Prevents unauthorized status updates

### Cookie Security

- HTTP-only (not accessible via JavaScript)
- Secure in production (HTTPS only)
- SameSite: lax (CSRF protection)

## Environment Variables

Required:
```bash
STRIPE_SECRET_KEY=sk_test_...
```

## Database Migration Notes

### Current Implementation

- Uses mock data in `utils/cleanerData.ts`
- Jobs fetched from Stripe metadata
- No database required

### Future Migration

When moving to database:

1. **Create Cleaners Table**
   ```sql
   CREATE TABLE cleaners (
     id UUID PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     phone VARCHAR(20) UNIQUE NOT NULL,
     email VARCHAR(255) UNIQUE,
     region VARCHAR(20) NOT NULL,
     active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Update `utils/cleanerData.ts`**
   - Replace `findCleanerByIdentifier()` with database query
   - Replace `findCleanerById()` with database query
   - Add database connection

3. **Update Job Queries**
   - Option 1: Keep Stripe as source, sync to DB
   - Option 2: Move jobs to database table
   - Update `getCleanerJobsFromStripe()` to query database

4. **Add Indexes**
   ```sql
   CREATE INDEX idx_cleaners_phone ON cleaners(phone);
   CREATE INDEX idx_cleaners_email ON cleaners(email);
   CREATE INDEX idx_jobs_cleaner ON jobs(assigned_cleaner_id);
   CREATE INDEX idx_jobs_date ON jobs(preferred_date);
   ```

## Extending the Portal

### Push Notifications

1. Add notification service (Firebase, OneSignal, etc.)
2. Store device tokens in cleaner profile
3. Send notifications on:
   - New job assignment
   - Job reminder (24h before)
   - Status change confirmations

### WhatsApp Deep Links

1. Add "Message Customer" button to job card
2. Generate WhatsApp link: `https://wa.me/{customerPhone}?text=...`
3. Pre-fill message template
4. Open in WhatsApp app

### Additional Features

- **Route Optimization**: Show jobs on map, optimize route
- **Time Tracking**: Clock in/out for jobs
- **Photo Upload**: Upload before/after photos
- **Customer Notes**: Add private notes about customer
- **Earnings Summary**: View weekly/monthly earnings
- **Profile Management**: Update phone, email, availability

## Troubleshooting

### Can't Login

- Check that cleaner exists in mock data
- Verify phone/email format matches exactly
- Check browser console for errors
- Verify API route is accessible

### No Jobs Showing

- Ensure jobs are assigned to cleaner's phone
- Check Stripe metadata has `assignedCleanerPhone`
- Verify job status is not cancelled
- Check date filters (today/upcoming)

### Status Update Fails

- Verify cleaner owns the job
- Check job status allows the transition
- Verify API route is accessible
- Check browser console for errors

## Files Structure

```
app/
  cleaners/
    login/
      page.tsx
    dashboard/
      page.tsx
    components/
      CleanerHeader.tsx
      JobCard.tsx
      JobList.tsx
      LocationBadge.tsx
      StatusBadge.tsx
      Tabs.tsx
  api/
    cleaners/
      login/
        route.ts
      me/
        route.ts
      jobs/
        route.ts
utils/
  cleanerData.ts
```

## Next Steps

1. **Add Real Database**
   - Create cleaners table
   - Migrate job data
   - Update queries

2. **Enhanced Security**
   - Add password authentication
   - Implement 2FA
   - Add session timeout

3. **Mobile App**
   - React Native version
   - Push notifications
   - Offline support

4. **Admin Features**
   - Assign jobs from dashboard
   - View all cleaner schedules
   - Bulk status updates



