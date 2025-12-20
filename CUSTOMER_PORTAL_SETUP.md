# Customer Self-Service Portal - Setup Guide

## Overview

The Customer Self-Service Portal allows customers to manage their bookings, view history, update preferences, and interact with the review/complaint systems.

## Features

- **Simple Email Auth**: Email-based login (Phase 1)
- **Dashboard**: Overview of upcoming bookings and quick actions
- **Upcoming Bookings**: View and manage future appointments
- **Booking History**: View past cleanings and leave reviews
- **Booking Details**: Full booking information and actions
- **Preferences**: Set preferred times, days, and communication settings
- **Billing**: View billing information (Phase 1: read-only)

## Authentication

### Phase 1: Simple Email Auth

- Customer enters email
- System finds customer by email or creates from booking
- Sets HTTP-only cookie: `customerId`
- No password required

### Future: Magic Link Auth

- TODO: Replace with secure magic-link email authentication
- Customer receives email with secure link
- Link expires after set time
- More secure than current approach

## Routes

### Frontend Pages

- `/customer/login` - Customer login page
- `/customer/dashboard` - Main dashboard
- `/customer/upcoming` - Upcoming bookings
- `/customer/history` - Booking history
- `/customer/booking/[bookingId]` - Booking details
- `/customer/preferences` - Preferences management
- `/customer/billing` - Billing information (Phase 1)

### API Endpoints

- `POST /api/customer/login` - Customer login
- `GET /api/customer/me` - Get current customer
- `POST /api/customer/logout` - Logout
- `GET /api/customer/bookings/list` - List bookings
- `PATCH /api/customer/bookings/update` - Update booking
- `POST /api/customer/bookings/cancel` - Cancel booking
- `PATCH /api/customer/preferences/update` - Update preferences

## Data Models

### Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  default_address TEXT,
  region VARCHAR(20) CHECK (region IN ('new_jersey', 'vermont')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### CustomerHomes Table

```sql
CREATE TABLE customer_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  label VARCHAR(255) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  region VARCHAR(20) NOT NULL CHECK (region IN ('new_jersey', 'vermont')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### CustomerPreferences Table

```sql
CREATE TABLE customer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL,
  preferred_time_window VARCHAR(20) CHECK (preferred_time_window IN ('morning', 'afternoon', 'evening')),
  preferred_day_of_week INTEGER CHECK (preferred_day_of_week >= 0 AND preferred_day_of_week <= 6),
  notes_for_cleaner TEXT,
  allow_whatsapp BOOLEAN DEFAULT true,
  allow_email BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

## Business Rules

### Rescheduling

- **Allowed**: If booking is > 24 hours away
- **Not Allowed**: If booking is < 24 hours away or already completed/cancelled
- **Action**: Updates `preferredDate` and `preferredTime` in Stripe metadata
- **Note**: Creates admin note "Customer rescheduled via portal"

### Cancellation

- **Allowed**: If booking is > 24 hours away OR status is "pending"
- **Not Allowed**: If booking is < 24 hours away and status is not "pending"
- **Action**: Sets status to "cancelled_by_customer"
- **Alert**: TODO - Send WhatsApp/email to admin

### Add-ons Modification

- **Allowed**: If booking is > 24 hours away
- **Action**: Updates `addOns` in Stripe metadata

## Integration Points

### Reviews System

- **History Page**: Shows "Leave a review" button for completed jobs
- **Booking Details**: Links to review page if no review exists
- **Review Display**: Shows existing reviews with ratings

### Complaints System

- **History Page**: Shows complaint status badges
- **Booking Details**: Displays complaint information if exists

### Booking System

- **Data Source**: Stripe Checkout Sessions
- **Metadata**: All booking data stored in Stripe session metadata
- **Updates**: Changes update Stripe metadata

## Route Protection

All `/customer/*` routes (except `/customer/login`) are protected:

1. Check for `customerId` cookie
2. Verify customer exists
3. Redirect to login if not authenticated

Implemented via:
- `/app/customer/layout.tsx` - Server-side protection
- `CustomerLayout` component - Client-side checks

## Testing

### Test Login

1. Navigate to `/customer/login`
2. Enter email from existing booking
3. Should redirect to dashboard
4. Cookie should be set

### Test Reschedule

1. Login to portal
2. Go to upcoming bookings
3. Click "Reschedule" on booking > 24h away
4. Select new date and time
5. Verify booking updated

### Test Cancel

1. Login to portal
2. Go to upcoming bookings
3. Click "Cancel" on booking > 24h away
4. Provide reason
5. Verify booking cancelled

## Database Migration

### Current Implementation

- Uses in-memory mock storage
- All functions ready for DB migration
- TODO comments mark migration points

### Migration Steps

1. **Create Tables** (see schemas above)
2. **Update `customerData.ts`**:
   - Replace mock storage with database queries
   - Add connection pooling
   - Implement transactions

3. **Add Foreign Keys**:
   - Link to bookings/jobs if needed

4. **Add Indexes**:
   ```sql
   CREATE INDEX idx_customers_email ON customers(email);
   CREATE INDEX idx_customer_homes_customer ON customer_homes(customer_id);
   CREATE INDEX idx_customer_preferences_customer ON customer_preferences(customer_id);
   ```

## Future Enhancements

1. **Magic Link Auth**
   - Secure email-based authentication
   - Expiring links
   - Better security

2. **Stripe Customer Portal**
   - Payment method management
   - Invoice viewing
   - Subscription management

3. **Multiple Homes**
   - Full CRUD for customer homes
   - Address management UI
   - Primary address selection

4. **Booking Modifications**
   - Change service type
   - Update add-ons
   - Modify special instructions

5. **Notifications**
   - Email notifications for booking changes
   - WhatsApp reminders
   - Status update alerts




