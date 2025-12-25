# Weekly Payout Summary Cron Schedule

## Schedule Configuration

**Vercel Cron Schedule:** `0 11 * * 1` (11:00 AM UTC every Monday)

**Local Time (America/New_York):**
- **EST (Eastern Standard Time, Nov-Mar):** 7:00 AM
- **EDT (Eastern Daylight Time, Mar-Nov):** 8:00 AM

## Date Range Calculation

The cron job calculates **last week's Monday-Sunday** range:

- **Last Monday:** 7 days before the cron run date (start of day)
- **Last Sunday:** 1 day before the cron run date (end of day)

Since the cron runs on Monday, this always captures the previous week's Monday through Sunday.

## Timezone Handling

- Cron schedule is in **UTC** (Vercel standard)
- Date range calculation uses server timezone
- Payout queries use `createdAt` which is stored in **UTC** in the database
- The date range correctly captures all payouts from last week regardless of timezone

## DST (Daylight Saving Time) Notes

- **EST to EDT transition (March):** Cron time shifts from 7:00 AM to 8:00 AM local time
- **EDT to EST transition (November):** Cron time shifts from 8:00 AM to 7:00 AM local time
- The date range calculation is unaffected by DST since it uses day-based arithmetic
- All payouts are stored in UTC, so queries are timezone-agnostic

## Adjusting the Schedule

To change when the cron runs:

1. **Edit `vercel.json`:**
   ```json
   {
     "crons": [{
       "path": "/api/cron/weekly-payout-summary",
       "schedule": "0 11 * * 1"  // Change this cron expression
     }]
   }
   ```

2. **Cron Expression Format:** `minute hour day-of-month month day-of-week`
   - `0 11 * * 1` = 11:00 AM UTC every Monday
   - `0 9 * * 1` = 9:00 AM UTC every Monday (5:00 AM EST / 6:00 AM EDT)
   - `0 14 * * 1` = 2:00 PM UTC every Monday (10:00 AM EST / 11:00 AM EDT)

3. **Redeploy** to Vercel for changes to take effect

## Testing

To test the cron job manually:

```bash
curl -X GET "https://your-domain.com/api/cron/weekly-payout-summary" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or use Vercel's cron job testing interface in the dashboard.















