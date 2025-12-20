# Google Review URL Setup Guide

## Current Status
✅ Placeholder URL is set in `.env` file:
```
NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL=https://g.page/r/PLACEHOLDER/review
```

## Once Google Business Profile is Verified

### Step 1: Get Your Review URL

**Method 1: From Google Business Profile**
1. Go to https://business.google.com
2. Select your VelocityMaid New Jersey location
3. Click "Get more reviews" or "Share review form"
4. Copy the URL (format: `https://g.page/r/[ID]/review`)

**Method 2: From Google Maps**
1. Open Google Maps
2. Search for "VelocityMaid" at your New Jersey address
3. Click on your business listing
4. Click "Write a review"
5. Copy the URL from the browser address bar

### Step 2: Update .env File

Replace the placeholder in `velocitymaid-nextjs/.env`:

```env
NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL=https://g.page/r/[YOUR_ACTUAL_ID]/review
```

**Example:**
```env
NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL=https://g.page/r/1a2b3c4d5e6f/review
```

### Step 3: Restart Your Server

After updating the `.env` file:
1. Stop your Next.js dev server (Ctrl+C)
2. Start it again: `npm run dev`
3. Test the review page at `/review-us/new-jersey`

## Testing

1. Visit: `http://localhost:3000/review-us/new-jersey`
2. Click "Leave a Google Review" button
3. Should open Google review form in a new tab

## Troubleshooting

- **URL doesn't work?** Make sure your Google Business Profile is verified and publicly visible
- **Button shows "#"?** Check that `NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL` is set correctly in `.env`
- **Still not working?** Restart your dev server after changing `.env`

## Alternative URL Formats

If Google gives you a different format, these also work:
- `https://search.google.com/local/writereview?placeid=[PLACE_ID]`
- `https://g.page/r/[ID]/review`
- `https://maps.google.com/maps?cid=[CID]&writeareview`


