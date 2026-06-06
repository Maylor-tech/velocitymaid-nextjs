# VelocityMaid — 50-Point Checklist DB Deploy (Safe Runbook)

Migration: `prisma/migrations/20260525000000_add_job_checklist_item`  
Model: `JobChecklistItem` (50 rows per job, unique `jobId` + `checklistItemId`)

---

## 1. Windows PowerShell — env for migration only

Run from project root. **Replace** `YOUR_PASSWORD` and `YOUR_PROJECT_REF` (e.g. `wkqglgdoseptvttrkapa`).

```powershell
cd c:\dev\velocitymaid-nextjs

# Direct Supabase host (port 5432) — NOT the pooler URL
$env:DIRECT_URL = "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"

# Use direct URL only for this migration session
$env:DATABASE_URL = $env:DIRECT_URL
```

Optional: confirm vars (password hidden if you paste carefully):

```powershell
echo $env:DIRECT_URL
```

After migration, **close the terminal** or unset so app dev does not keep using direct URL for everything:

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue
```

---

## 2. Migrate (production-safe)

```powershell
npx prisma migrate deploy
```

Expected: `Applying migration 20260525000000_add_job_checklist_item` (or “No pending migrations” if already applied).

**Do not run:** `prisma migrate reset`, `prisma db push` (destructive / bypasses history on prod).

---

## 3. Verify script

Still in same shell **with** `DATABASE_URL` / `DIRECT_URL` set to direct URL:

```powershell
npx tsx scripts/verify-job-checklist.ts
```

Expected: `OK: checklist init idempotent, update/uncheck persisted.`  
If no assigned job exists: `SKIP: No assigned job found` (migration still OK).

Optional:

```powershell
npx prisma validate
npx prisma generate
npm run build
```

---

## 4. Post-deploy browser smoke test

Use one **assigned** job ID across all three portals.

### Cleaner (read/write)

1. Log in: `/cleaners/login`
2. Open `/cleaners/dashboard` → pick a job → **Open 50-Point Checklist**
3. Check 2–3 items → wait for **Saved**
4. Hard refresh → items stay checked
5. DevTools → Network: `PATCH /api/cleaner/jobs/{jobId}/checklist` → `200`, `success: true`

### Customer (read-only)

1. Log in: `/customer/login` (account that owns that job)
2. Open `/customer/jobs/{jobId}`
3. **Hospitality Standards Progress** shows same completion %
4. No checkboxes; `GET /api/customer/jobs/{jobId}/checklist` → `200`
5. `PATCH` to customer checklist URL should **405** (no handler)

### Admin (audit)

1. Log in: `/admin/login`
2. Open `/admin/jobs/{jobId}`
3. **50-Point Hospitality Audit** shows completed lines with timestamps / specialist name where completed
4. `GET /api/admin/jobs/{jobId}/checklist` → `200`

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| **P1001** Can't reach database server | Wrong host, firewall, Supabase paused, VPN | Use `db.PROJECT_REF.supabase.co:5432`; check Supabase dashboard → Project active; try from local machine not CI sandbox |
| **ENOTFOUND** tenant/user `postgres.PROJECT_REF` | **Pooler** URL used for migrate | Use direct URL: `postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres` (user is `postgres`, not `postgres.ref`) |
| **SSL** certificate / `sslmode` errors | Missing SSL params | Add `?sslmode=require` to connection string |
| **P3009** / migration failed mid-way | Partial apply | Do **not** reset prod; fix connection, run `migrate deploy` again; inspect `_prisma_migrations` in Supabase SQL editor |
| **No pending migrations** / already applied | Migration ran before | Run verify script + smoke test only |
| **P1012** / env var not found | `DATABASE_URL` unset | Set `$env:DATABASE_URL` and `$env:DIRECT_URL` in same PowerShell session before migrate |
| **Permission denied** on table | DB user not owner | Use Supabase `postgres` role password from Settings → Database |
| Verify script: table does not exist | Migrate not applied | Run `migrate deploy` first |
| App works locally but not Vercel | Vercel env still pooler-only / wrong `DIRECT_URL` | Set both vars in Vercel (see §6); redeploy after env change |

---

## 6. Vercel deployment notes

### When to run migration

| Approach | When |
|----------|------|
| **Local `migrate deploy`** (recommended) | Before or right after deploy; you control credentials and see output |
| **CI step** | Optional: GitHub Action with `DATABASE_URL`/`DIRECT_URL` secrets → direct host only on migrate job |
| **Not on Vercel build** | Default `next build` does not run migrations — add explicit step if you automate |

### Env vars on Vercel

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | **Pooler** (session mode) for runtime app queries — e.g. `...@aws-0-REGION.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require` |
| `DIRECT_URL` | **Direct** host for Prisma migrations / `prisma migrate deploy` — `...@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require` |

Prisma schema uses `url = DATABASE_URL` and `directUrl = DIRECT_URL`. Runtime should use pooler; migrations/scripts use direct.

### Warnings

- **Never** `prisma migrate reset` on production.
- **Avoid** `prisma db push` on production (skips migration history).
- Do not point `DATABASE_URL` at pooler **only** when running `migrate deploy` from a shell — set direct URL for that session (§1).

### After Vercel env update

Redeploy → smoke test §4 on production URLs.

---

## Quick copy-paste block (full local deploy)

```powershell
cd c:\dev\velocitymaid-nextjs
$env:DIRECT_URL = "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
$env:DATABASE_URL = $env:DIRECT_URL
npx prisma migrate deploy
npx tsx scripts/verify-job-checklist.ts
```

Then run §4 browser tests against `http://localhost:3000` (or production after Vercel deploy).
