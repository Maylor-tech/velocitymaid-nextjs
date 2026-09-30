/**
 * Gate 3 — apply ONLY guest-stay-dates DDL on staging, exercise, then rollback DDL.
 * Does NOT touch _prisma_migrations (staging is many migrations behind prod).
 * Refuses production. Leaves staging schema as found after successful run.
 *
 *   npx dotenv-cli -e .env.staging -- node scripts/gate3-guest-stay-dates-staging-ddl-exercise.cjs
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');
const path = require('node:path');

const PROD = 'chsahtnpwssyfrqzcncz';
const STG = 'wfudxrziqyfvrdgnocky';
const MIGRATION_SQL = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260929120000_job_guest_stay_dates',
  'migration.sql'
);

const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
if (urls.length < 1) {
  console.error('STOP: DATABASE_URL required');
  process.exit(2);
}
for (const u of urls) {
  if (u.includes(PROD)) {
    console.error('STOP: production ref — refusing DDL exercise');
    process.exit(2);
  }
  if (!u.includes(STG)) {
    console.error('STOP: staging ref missing');
    process.exit(2);
  }
}

async function columns(prisma) {
  return prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Job'
      AND column_name IN ('guestCheckInDate', 'guestCheckOutDate', 'preferredDate')
    ORDER BY column_name
  `);
}

async function indexes(prisma) {
  return prisma.$queryRawUnsafe(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'Job'
      AND indexname IN ('Job_guestCheckInDate_idx', 'Job_guestCheckOutDate_idx')
    ORDER BY indexname
  `);
}

async function main() {
  const sql = fs.readFileSync(MIGRATION_SQL, 'utf8');
  const prisma = new PrismaClient();
  let applied = false;
  try {
    const before = await columns(prisma);
    console.log(JSON.stringify({ phase: 'before', columns: before }, null, 2));
    if (before.some((c) => c.column_name === 'guestCheckInDate')) {
      console.error('STOP: columns already present — abort to avoid unexpected state');
      process.exit(3);
    }

    // Explicit single-statement DDL (avoid multi-statement / splitter edge cases).
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "guestCheckInDate" TIMESTAMP(3)`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "guestCheckOutDate" TIMESTAMP(3)`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Job_guestCheckInDate_idx" ON "Job"("guestCheckInDate")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Job_guestCheckOutDate_idx" ON "Job"("guestCheckOutDate")`
    );
    applied = true;

    // Confirm migration file content still matches what we applied.
    if (
      !sql.includes('guestCheckInDate') ||
      !sql.includes('guestCheckOutDate') ||
      !sql.includes('Job_guestCheckInDate_idx')
    ) {
      console.error('STOP: migration.sql content mismatch');
      process.exit(1);
    }

    const after = await columns(prisma);
    const idxs = await indexes(prisma);
    const hasIn = after.some((c) => c.column_name === 'guestCheckInDate');
    const hasOut = after.some((c) => c.column_name === 'guestCheckOutDate');
    console.log(
      JSON.stringify(
        {
          phase: 'after_apply',
          columns: after,
          indexes: idxs.map((i) => i.indexname),
          ok: hasIn && hasOut && idxs.length === 2,
        },
        null,
        2
      )
    );
    if (!hasIn || !hasOut || idxs.length !== 2) {
      console.error('STOP: DDL apply verification failed');
      process.exit(1);
    }

    const sample = await prisma.$queryRawUnsafe(`
      SELECT id, "branchId", "customerId", "propertyId"
      FROM "Job"
      ORDER BY "createdAt" DESC
      LIMIT 1
    `);
    if (!sample?.[0]?.branchId) {
      console.error('STOP: no staging Job sample for FK clone');
      process.exit(1);
    }
    const s = sample[0];
    const id = `gate3-ddl-${Date.now()}`;

    // Raw insert avoids Prisma client expecting newer columns staging lacks.
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Job" (
         id, "branchId", "customerId", "propertyId",
         "preferredDate", "guestCheckInDate", "guestCheckOutDate",
         status, "paymentStatus", currency, "createdAt", "internalNotes"
       ) VALUES (
         $1, $2, $3, $4,
         TIMESTAMP '2026-10-05 00:00:00', NULL, NULL,
         'COMPLETED'::"JobStatus", 'PAID'::"PaymentStatus", 'USD', NOW(),
         '[Gate3 DDL exercise — ephemeral]'
       )`,
      id,
      s.branchId,
      s.customerId,
      s.propertyId
    );

    const legacyRows = await prisma.$queryRawUnsafe(
      `SELECT "preferredDate", "guestCheckInDate", "guestCheckOutDate"
       FROM "Job" WHERE id = $1`,
      id
    );
    const legacy = legacyRows[0];

    await prisma.$executeRawUnsafe(
      `UPDATE "Job"
       SET "guestCheckInDate" = TIMESTAMP '2026-10-01 00:00:00',
           "guestCheckOutDate" = TIMESTAMP '2026-10-04 00:00:00'
       WHERE id = $1`,
      id
    );
    const structuredRows = await prisma.$queryRawUnsafe(
      `SELECT "preferredDate", "guestCheckInDate", "guestCheckOutDate"
       FROM "Job" WHERE id = $1`,
      id
    );
    const structured = structuredRows[0];

    await prisma.$executeRawUnsafe(
      `UPDATE "Job"
       SET "guestCheckOutDate" = NULL, "guestCheckInDate" = NULL
       WHERE id = $1`,
      id
    );
    const clearedRows = await prisma.$queryRawUnsafe(
      `SELECT "preferredDate", "guestCheckInDate", "guestCheckOutDate"
       FROM "Job" WHERE id = $1`,
      id
    );
    const cleared = clearedRows[0];

    await prisma.$executeRawUnsafe(`DELETE FROM "Job" WHERE id = $1`, id);

    const toIsoDay = (v) => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v);
      return d.toISOString();
    };

    const exercise = {
      legacyOk:
        toIsoDay(legacy?.preferredDate) === '2026-10-05T00:00:00.000Z' &&
        legacy.guestCheckOutDate == null,
      structuredOk:
        toIsoDay(structured?.preferredDate) === '2026-10-05T00:00:00.000Z' &&
        toIsoDay(structured?.guestCheckInDate) === '2026-10-01T00:00:00.000Z' &&
        toIsoDay(structured?.guestCheckOutDate) === '2026-10-04T00:00:00.000Z',
      clearOk:
        cleared?.guestCheckOutDate == null &&
        cleared?.guestCheckInDate == null &&
        toIsoDay(cleared?.preferredDate) === '2026-10-05T00:00:00.000Z',
      values: {
        legacyPreferred: toIsoDay(legacy?.preferredDate),
        structuredCheckout: toIsoDay(structured?.guestCheckOutDate),
        structuredService: toIsoDay(structured?.preferredDate),
      },
    };
    exercise.ok = exercise.legacyOk && exercise.structuredOk && exercise.clearOk;
    console.log(JSON.stringify({ exercise }, null, 2));
    if (!exercise.ok) {
      console.error('STOP: exercise failed');
      process.exit(1);
    }
  } finally {
    if (applied) {
      // Rollback DDL so staging remains as found (full migrate deploy still pending).
      await prisma.$executeRawUnsafe(
        `DROP INDEX IF EXISTS "Job_guestCheckOutDate_idx"`
      );
      await prisma.$executeRawUnsafe(
        `DROP INDEX IF EXISTS "Job_guestCheckInDate_idx"`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Job" DROP COLUMN IF EXISTS "guestCheckOutDate"`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Job" DROP COLUMN IF EXISTS "guestCheckInDate"`
      );
      const restored = await columns(prisma);
      console.log(
        JSON.stringify(
          {
            phase: 'after_rollback',
            columns: restored,
            guestColsGone: !restored.some((c) =>
              ['guestCheckInDate', 'guestCheckOutDate'].includes(c.column_name)
            ),
          },
          null,
          2
        )
      );
    }
    await prisma.$disconnect();
  }
  console.log('GATE3_STAGING_DDL_EXERCISE: PASS');
}

main().catch((e) => {
  console.error('STOP:', e instanceof Error ? e.message : e);
  process.exit(1);
});
