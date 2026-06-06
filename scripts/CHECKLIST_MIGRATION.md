# Job checklist migration deploy

## Migration file

`prisma/migrations/20260525000000_add_job_checklist_item/migration.sql`

Creates `JobChecklistItem` with unique `(jobId, checklistItemId)`.

## Apply (no data reset)

Use a **direct** Postgres URL for migrations (not PgBouncer transaction pooler).

```powershell
cd c:\dev\velocitymaid-nextjs
$env:DIRECT_URL = "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres?sslmode=require"
$env:DATABASE_URL = $env:DIRECT_URL
npx prisma migrate deploy
```

Local dev (creates migration history if needed):

```powershell
npx prisma migrate dev
```

## Verify after deploy

```powershell
npx tsx scripts/verify-job-checklist.ts
```

## API routes

| Role     | Method | Path                                      |
| -------- | ------ | ----------------------------------------- |
| Customer | GET    | `/api/customer/jobs/[jobId]/checklist`    |
| Cleaner  | GET    | `/api/cleaner/jobs/[jobId]/checklist`     |
| Cleaner  | PATCH  | `/api/cleaner/jobs/[jobId]/checklist`     |
| Cleaner  | PUT    | `/api/cleaner/jobs/[jobId]/checklist`     |
| Admin    | GET    | `/api/admin/jobs/[jobId]/checklist`        |
