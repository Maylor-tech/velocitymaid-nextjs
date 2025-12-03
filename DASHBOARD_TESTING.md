# Dashboard Testing Guide

## Quick Start

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Dashboard**
   ```
   http://localhost:3000/dashboard
   ```

3. **Verify Data Loading**
   - Check that KPI cards display
   - Verify job list appears
   - Confirm no errors in console

## Prerequisites

### Environment Variables

Ensure `.env.local` contains:
```bash
STRIPE_SECRET_KEY=sk_test_...
```

### Test Data

You need completed Stripe checkout sessions with metadata:
- `firstName`
- `preferredDate`
- `serviceType`
- `serviceLocation` (optional, defaults to "new_jersey")
- `address`
- `phone`

## Manual Testing Checklist

### ✅ Basic Functionality

- [ ] Dashboard loads without errors
- [ ] Header displays correctly
- [ ] Region tabs are clickable
- [ ] KPI cards show data
- [ ] Job list displays jobs
- [ ] Revenue chart renders
- [ ] Operations alerts show (if any)
- [ ] Booking feed displays
- [ ] Cleaner schedules appear (if cleaners assigned)

### ✅ Region Filtering

- [ ] "New Jersey" tab filters to NJ jobs only
- [ ] "Vermont" tab filters to VT jobs only
- [ ] "All" tab shows all jobs
- [ ] Revenue chart updates with region filter
- [ ] Cleaner schedules filter by region

### ✅ Real-time Updates

- [ ] Dashboard refreshes every 10 seconds
- [ ] New bookings appear in feed
- [ ] KPI metrics update
- [ ] Job status changes reflect

### ✅ Data Display

- [ ] Job cards show all required fields
- [ ] Location badges display correctly
- [ ] Status badges show correct colors
- [ ] Dates format correctly
- [ ] Prices display with $ symbol
- [ ] Cleaner names appear when assigned

### ✅ Error Handling

- [ ] Error message displays if API fails
- [ ] Retry button works
- [ ] Loading state shows while fetching
- [ ] Empty states display when no data

## API Testing

### Test API Endpoint Directly

```bash
# All regions
curl http://localhost:3000/api/dashboard/data

# New Jersey only
curl http://localhost:3000/api/dashboard/data?region=new_jersey

# Vermont only
curl http://localhost:3000/api/dashboard/data?region=vermont
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "jobsToday": [...],
    "jobsNext7Days": [...],
    "revenueData": [...],
    "cleanerSchedules": [...],
    "unassignedJobs": [...],
    "bookingFeed": [...],
    "reminderStatus": [...],
    "jobsMissingConfirmation": [...],
    "jobsWithInvalidPhone": [...],
    "kpiStats": {...}
  },
  "region": null,
  "timestamp": "2024-12-26T10:30:00Z"
}
```

## Creating Test Data

### Via Checkout API

1. Create a booking via `/api/checkout`:
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastInitial": "U",
    "phone": "+19731234567",
    "email": "test@example.com",
    "address": "123 Test St",
    "serviceType": "basic",
    "preferredDate": "2024-12-27",
    "preferredTime": "10:00 AM",
    "serviceLocation": "new_jersey",
    "totalPrice": 120,
    "addOns": {}
  }'
```

2. Complete the checkout session in Stripe Dashboard (test mode)

3. Refresh dashboard to see the booking

## Troubleshooting

### No Data Showing

**Problem**: Dashboard loads but shows no jobs

**Solutions**:
1. Check Stripe secret key is set correctly
2. Verify you have completed checkout sessions
3. Check browser console for errors
4. Test API endpoint directly: `/api/dashboard/data`
5. Verify checkout sessions have required metadata

### Slow Performance

**Problem**: Dashboard takes long to load

**Solutions**:
1. Check Stripe API response times
2. Reduce number of sessions fetched (add date filters)
3. Implement pagination for large datasets
4. Use caching for frequently accessed data

### Region Filter Not Working

**Problem**: Filtering doesn't change displayed data

**Solutions**:
1. Check `serviceLocation` is in Stripe metadata
2. Verify region parameter is passed to API
3. Check API response includes filtered data
4. Clear browser cache and refresh

### Missing Fields

**Problem**: Job cards missing information

**Solutions**:
1. Verify Stripe metadata contains all required fields
2. Check `sessionToJob` function handles missing fields
3. Add default values for optional fields
4. Review checkout route to ensure metadata is set

## Performance Testing

### Load Test

1. Create 100+ test bookings
2. Load dashboard
3. Measure load time
4. Check for performance issues

### Stress Test

1. Create bookings with various dates
2. Test region filtering
3. Verify real-time updates work
4. Check memory usage

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

## Next Steps for Production

1. **Database Integration**
   - Move from Stripe metadata to database
   - Improve query performance
   - Add indexes for common queries

2. **Caching**
   - Implement Redis for dashboard data
   - Cache KPI calculations
   - Reduce Stripe API calls

3. **Real-time Updates**
   - WebSocket support
   - Server-sent events
   - Push notifications for alerts

4. **Advanced Features**
   - Export to CSV/PDF
   - Advanced filtering
   - Job assignment from dashboard
   - Cleaner availability calendar



