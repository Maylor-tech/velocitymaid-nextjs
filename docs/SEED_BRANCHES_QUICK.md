# Quick Guide: Seed Branches on Vercel

## Easiest Method: Using Secret Key

### Step 1: Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `BRANCH_SEED_SECRET`
   - **Value**: Generate a random secret (e.g., use `openssl rand -hex 32` or any random string)
   - **Environment**: Production (and Preview if needed)
4. Save and redeploy

### Step 2: Call the API Endpoint

After deployment, use any of these methods:

#### Using cURL:
```bash
curl -X POST https://your-app.vercel.app/api/admin/branches/seed \
  -H "Content-Type: application/json" \
  -H "x-seed-secret: YOUR_SECRET_FROM_STEP_1"
```

#### Using PowerShell:
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-seed-secret" = "YOUR_SECRET_FROM_STEP_1"
}

Invoke-RestMethod -Uri "https://your-app.vercel.app/api/admin/branches/seed" `
    -Method POST `
    -Headers $headers
```

#### Using Browser Console:
```javascript
fetch('https://your-app.vercel.app/api/admin/branches/seed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-seed-secret': 'YOUR_SECRET_FROM_STEP_1'
  }
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

### Step 3: Verify Success

You should see a response like:
```json
{
  "success": true,
  "message": "All branches seeded successfully",
  "branches": {
    "newJersey": { ... },
    "vermont": { ... },
    "portAntonio": { ... }
  }
}
```

### Step 4: Remove Secret (Optional but Recommended)

After seeding, you can remove the `BRANCH_SEED_SECRET` environment variable from Vercel for security.

---

## Alternative: Using Admin User ID

If you already have an admin user in your database:

```bash
curl -X POST https://your-app.vercel.app/api/admin/branches/seed \
  -H "Content-Type: application/json" \
  -H "x-admin-id: YOUR_ADMIN_USER_ID"
```

To find your admin user ID, check your database's `User` table where `role = 'ADMIN'`.
