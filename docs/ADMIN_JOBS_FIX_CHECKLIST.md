# Admin Jobs Page Fix — Where to Look & What to Do

## The problem (1 sentence)

Production is still running **old code**. The DB has no `Job.checkoutSessionId`; the fix is already in this repo (explicit select, no `checkoutSessionId`), but **velocitymaid.com has not been redeployed** with that code.

---

## Where the fix lives (in your repo)

| What | File | Status |
|------|------|--------|
| Jobs list API | `app/api/admin/jobs/list/route.ts` | Uses **explicit `select`**; only requests real columns (`sessionId`, etc.). Never `checkoutSessionId`. |
| Job creation | `app/api/booking/create/route.ts` | No longer writes `checkoutSessionId`, `paymentIntentId`, `paymentStatus`, or `paidAt`. |
| Schema | `prisma/schema.prisma` | `Job` model has `sessionId` only (no `checkoutSessionId`). |

**Not in .env** — This is not an env or Vercel env issue. It’s **code + deploy**.

---

## Why you still see the error

- **Local / repo:** Code is correct; list route uses explicit select.
- **Production (velocitymaid.com):** The app is still a **previous deployment** (before the fix or from a different branch), so the running API still does a `findMany` that expects `checkoutSessionId` (or was built with an old Prisma client).

So you’re not seeing what Laura sees because the **jobs list request fails with 500** before any jobs (or empty state) can load.

---

## Checklist — get to “see what Laura sees”

1. **Confirm the fix is in your repo**
   - Open `app/api/admin/jobs/list/route.ts`.
   - You should see `prisma.job.findMany({ where, select: { id: true, sessionId: true, ... } })` and **no** `checkoutSessionId` in `select`.

2. **Commit and push**
   - Commit any uncommitted changes (list route, booking create, jobs page UX).
   - Push to the branch Vercel deploys from (usually `main`).

3. **Redeploy on Vercel**
   - Vercel Dashboard → your project → **Deployments**.
   - Either wait for the new deployment from the push, or trigger **Redeploy** on the latest deployment.
   - Optional: **Redeploy** with “Clear cache and redeploy” so the build runs a fresh `prisma generate` and `next build`.

4. **Verify build**
   - In the Vercel deployment log, confirm the build runs `prisma generate && next build` (from `package.json`). That way the Prisma client on production matches your current schema.

5. **Test as “you” (global admin) seeing Laura’s world**
   - Go to **https://velocitymaid.com/admin/jobs**.
   - Set **Branch** to **New Jersey**.
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R).
   - You should see either the jobs table (if there are jobs) or “No jobs yet — new bookings will appear here automatically.” **No** red Prisma error.

Once that works, you see the same Jobs page and data (for NJ) that Laura sees when she’s logged in as the NJ branch admin.

---

## If it still fails after a redeploy

- In Vercel, open the **latest deployment** → **Functions** or **Logs**, and reproduce the error (open /admin/jobs, Branch = New Jersey). Check the log for the same `checkoutSessionId` error.
- Confirm the deployment is from the **commit** that contains the list-route fix (explicit select, no `checkoutSessionId`).
- If the repo has multiple branches, confirm Vercel is set to deploy the branch you pushed to (e.g. **main**).
