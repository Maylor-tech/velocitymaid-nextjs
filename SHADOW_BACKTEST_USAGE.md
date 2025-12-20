# Shadow Backtest API Usage

## Endpoint

```
POST /api/admin/payout-shadow/run
```

## Request Body

```json
{
  "days": 30,        // Optional: Number of days to look back (default: 30)
  "maxJobs": 500,    // Optional: Maximum jobs to process (default: 500)
  "branchId": "..."  // Optional: Filter by specific branch
}
```

## Response

```json
{
  "success": true,
  "summary": {
    "processed": 150,
    "stored": 120,
    "skipped_no_policy": 20,
    "skipped_no_legacy": 10,
    "errors": 0
  },
  "errorDetails": []
}
```

## Usage Examples

### PowerShell

```powershell
$body = @{
  days = 30
  maxJobs = 500
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/admin/payout-shadow/run" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### curl

```bash
curl -X POST http://localhost:3000/api/admin/payout-shadow/run \
  -H "Content-Type: application/json" \
  -d '{"days":30,"maxJobs":500}'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/admin/payout-shadow/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ days: 30, maxJobs: 500 })
});

const result = await response.json();
console.log(result);
```

## Verification Queries

After running the backtest, verify results in Supabase:

```sql
-- Count total shadow results
SELECT COUNT(*) FROM "PayoutPolicyShadowResult";

-- Count by branch
SELECT "branchId", COUNT(*)
FROM "PayoutPolicyShadowResult"
GROUP BY "branchId"
ORDER BY COUNT(*) DESC;

-- Recent results
SELECT *
FROM "PayoutPolicyShadowResult"
ORDER BY "createdAt" DESC
LIMIT 20;

-- Delta analysis
SELECT 
  AVG(delta) AS avg_delta,
  MIN(delta) AS min_delta,
  MAX(delta) AS max_delta,
  COUNT(*) AS total
FROM "PayoutPolicyShadowResult";
```

## Environment Variables

Make sure these are set in `.env.local`:

```
PAYOUT_POLICY_ENGINE_MODE=shadow
PAYOUT_SHADOW_DAYS=30
PAYOUT_SHADOW_MAX_JOBS=500
```







