# Google Review URL Setup Guide

Google public reviews and the internal `/review/[jobId]` feedback page are **separate**.

- **Google** → customer leaves a public Google Business Profile review
- **Internal** → VelocityMaid service feedback / re-clean / cleaner scorecards (keep as-is)

Do **not** implement rating gating on Google review request emails. Every customer who receives a Google review request gets the same branch Google destination.

---

## Environment variables

| Variable | Market | Notes |
|---|---|---|
| `NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL` | Vermont | **Required** for Vermont Google review emails. Verified URL: `https://g.page/r/Ccs_uOvQIwh5ECE/review` |
| `NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL` | New Jersey | Verified NJ `g.page` URL when ready. Do **not** set this to the Vermont URL. |
| `GOOGLE_REVIEW_URL` | New Jersey (optional server override) | Fallback for NJ only |

Unresolved job branch/service location **fails safely** — the app will not guess Vermont vs New Jersey.

---

## Vermont (production)

### 1. Add in Vercel (Production + Preview as needed)

```
NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL=https://g.page/r/Ccs_uOvQIwh5ECE/review
```

`NEXT_PUBLIC_*` values are baked at **build time** — redeploy after adding/changing.

### 2. Local `.env` / `.env.local`

```env
NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL=https://g.page/r/Ccs_uOvQIwh5ECE/review
```

### 3. How Vermont jobs get the link

- Admin **Send review request** on a completed job (`send_review`) resolves the job’s `Branch.slug` / `serviceLocation` and embeds the Vermont Google URL in the email CTA.
- Cron `/api/cron/send-review-requests` resolves **per job** the same way.
- CTA opens Google’s review UI directly (no `/review/[jobId]` placeholder routing).

---

## New Jersey

1. In Google Business Profile for the NJ location, copy **Get more reviews** / share review form URL (`https://g.page/r/[ID]/review`).
2. Set:

```env
NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL=https://g.page/r/[YOUR_NJ_ID]/review
```

3. Marketing page: `/review-us/new-jersey`
4. Do **not** replace NJ configuration with the Vermont URL.

Placeholder values containing `PLACEHOLDER` are rejected at send time.

---

## Testing

1. Vermont completed job → admin **Send review request** → email CTA = Vermont `g.page` URL.
2. Click CTA → Google’s write-a-review interface for VelocityMaid Vermont.
3. Job with missing/unknown branch → send fails with a clear configuration error (no wrong GBP).
4. Internal `/review/[jobId]` still loads for service feedback.

## Alternative URL formats

These also work when Google provides them:

- `https://g.page/r/[ID]/review`
- `https://search.google.com/local/writereview?placeid=[PLACE_ID]`
- `https://maps.google.com/maps?cid=[CID]&writeareview`
