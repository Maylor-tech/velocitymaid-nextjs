# How to Seed Branches on Vercel

After deploying to Vercel, you need to seed the branches in your production database. Here are several methods:

## Method 1: Using cURL (Recommended)

### Option A: With Admin User ID Header

First, you need to find or create an admin user in your production database, then use their ID:

```bash
curl -X POST https://your-app.vercel.app/api/admin/branches/seed \
  -H "Content-Type: application/json" \
  -H "x-admin-id: YOUR_ADMIN_USER_ID"
```

### Option B: With Bearer Token

If you have a JWT token:

```bash
curl -X POST https://your-app.vercel.app/api/admin/branches/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Method 2: Using PowerShell (Windows)

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-admin-id" = "YOUR_ADMIN_USER_ID"
}

Invoke-RestMethod -Uri "https://your-app.vercel.app/api/admin/branches/seed" `
    -Method POST `
    -Headers $headers
```

## Method 3: Using Browser Console

1. Open your Vercel app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run this JavaScript:

```javascript
fetch('https://your-app.vercel.app/api/admin/branches/seed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-id': 'YOUR_ADMIN_USER_ID' // Replace with actual admin user ID
  }
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## Method 4: Using Postman or Insomnia

1. Create a new POST request
2. URL: `https://your-app.vercel.app/api/admin/branches/seed`
3. Headers:
   - `Content-Type: application/json`
   - `x-admin-id: YOUR_ADMIN_USER_ID`
4. Send the request

## Method 5: Temporarily Bypass Auth (One-Time Setup)

If you don't have an admin user yet, you can temporarily modify the endpoint to allow seeding without auth:

**⚠️ WARNING: Only do this temporarily and remove the bypass after seeding!**

1. Modify `app/api/admin/branches/seed/route.ts`:
   - Comment out the `requireRole` line
   - Or add a temporary environment variable check

2. Deploy to Vercel

3. Call the endpoint (no auth needed)

4. Revert the change and redeploy

## Method 6: Using Vercel CLI

You can also run the seed script directly using Vercel's CLI:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link to your project
vercel link

# Run the seed script (requires database connection)
vercel env pull .env.local
npx tsx scripts/seed-branches-db.ts
```

## Finding Your Admin User ID

If you need to find or create an admin user:

1. Connect to your production database
2. Check the `User` table for users with `role = 'ADMIN'`
3. Use their `id` in the `x-admin-id` header

Or create one via your admin panel if available.

## Expected Response

On success, you should see:

```json
{
  "success": true,
  "message": "All branches seeded successfully",
  "branches": {
    "newJersey": {
      "id": "...",
      "slug": "new-jersey",
      "name": "New Jersey",
      "country": "United States",
      "status": "ACTIVE"
    },
    "vermont": {
      "id": "...",
      "slug": "vermont",
      "name": "Vermont",
      "country": "United States",
      "status": "ACTIVE"
    },
    "portAntonio": {
      "id": "...",
      "slug": "port-antonio",
      "name": "Port Antonio",
      "country": "Jamaica",
      "status": "ACTIVE"
    }
  }
}
```

## Troubleshooting

### 401 Unauthorized
- Make sure you're providing a valid admin user ID in the `x-admin-id` header
- Or ensure the admin user exists in your production database

### 500 Internal Server Error
- Check Vercel function logs for detailed error messages
- Verify your database connection string is set correctly in Vercel environment variables
- Make sure the database schema is up to date

### Connection Issues
- Verify your Vercel app URL is correct
- Check that the API route is deployed correctly
- Ensure your database allows connections from Vercel's IP addresses
