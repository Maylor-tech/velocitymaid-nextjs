# VelocityMaid Operations Command Center - Setup Guide

## Overview

The Operations Command Center dashboard provides real-time operational visibility for both New Jersey and Vermont service regions. It displays jobs, revenue, cleaner schedules, and operational alerts.

## Features

- **Real-time Data**: Auto-refreshes every 10 seconds
- **Multi-Region Support**: Filter by New Jersey, Vermont, or view all
- **KPI Dashboard**: Key metrics at a glance
- **Job Timeline**: Upcoming jobs sorted by date/time
- **Cleaner Schedules**: View cleaner assignments and detect overlaps
- **Revenue Tracking**: 7-day revenue chart by region
- **Operations Alerts**: Automatic flagging of issues
- **Live Booking Feed**: Real-time new bookings (last 24h)

## Access

Navigate to: `/dashboard`

## Components

### Main Sections

1. **Header**: Dashboard title and description
2. **Region Tabs**: Filter by New Jersey, Vermont, or All
3. **KPI Cards**: 6 key metrics
4. **Job Timeline**: Upcoming jobs (next 7 days)
5. **Operations Alerts**: Issues requiring attention
6. **Booking Feed**: New bookings in last 24 hours
7. **Revenue Chart**: 7-day revenue by region
8. **Cleaner Schedules**: Assigned jobs per cleaner

### KPI Metrics

- **Jobs Today**: Number of jobs scheduled for today
- **Revenue Today**: Total revenue from today's jobs
- **Completion Rate**: Percentage of completed jobs
- **Active Cleaners**: Number of cleaners with assignments today
- **Pending Approval**: Jobs awaiting approval (placeholder)
- **Missing Assignment**: Jobs without cleaner assignment

## Data Source

The dashboard pulls data from **Stripe Checkout Sessions**:
- All completed checkout sessions are treated as bookings
- Metadata contains booking details (customer, service, date, etc.)
- Status is determined from metadata flags

## Environment Variables

Required:
```bash
STRIPE_SECRET_KEY=sk_test_...
```

## API Endpoint

The dashboard uses: `/api/dashboard/data?region=new_jersey|vermont|null`

This endpoint:
- Fetches data from Stripe
- Filters by region if specified
- Returns aggregated dashboard data
- Revalidates every 10 seconds

## Real-time Updates

- Dashboard auto-refreshes every 10 seconds
- Uses Next.js `revalidate` for server-side caching
- Client-side polling for live updates

## Testing

### Local Testing

1. Ensure Stripe secret key is set in `.env.local`
2. Navigate to `http://localhost:3000/dashboard`
3. Test region filtering
4. Verify data loads correctly

### With Mock Data

If you don't have Stripe data yet, you can:
1. Create test checkout sessions via `/api/checkout`
2. Complete them in Stripe test mode
3. View them in the dashboard

## Troubleshooting

### No Data Showing

- Check that `STRIPE_SECRET_KEY` is set
- Verify you have completed checkout sessions in Stripe
- Check browser console for errors
- Verify API route is accessible: `/api/dashboard/data`

### Slow Loading

- Stripe API calls can be slow with many sessions
- Consider pagination for large datasets
- Check network tab for API response times

### Missing Fields

- Ensure checkout sessions have required metadata:
  - `firstName`
  - `preferredDate`
  - `serviceType`
  - `serviceLocation`

## Future Enhancements

- Database integration (currently uses Stripe as source of truth)
- Real-time WebSocket updates
- Export functionality
- Advanced filtering
- Job assignment from dashboard
- Cleaner availability management




