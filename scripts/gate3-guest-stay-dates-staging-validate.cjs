/**
 * Gate 3 — staging-only migration validation for job guest stay dates.
 * Refuses production. Never prints connection strings.
 *
 * Usage:
 *   npx dotenv-cli -e .env.staging -- node scripts/gate3-guest-stay-dates-staging-validate.cjs
 *   npx dotenv-cli -e .env.staging -- node scripts/gate3-guest-stay-dates-staging-validate.cjs --deploy
 *
 * --deploy applies pending Prisma migrations on staging only, then verifies columns.
 * Without --deploy: status + column probe only (safe if already applied).
 */
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const PROD = 'chsahtnpwssyfrqzcncz';
const STG = 'wfudxrziqyfvrdgnocky';
const MIGRATION = '20260929120000_job_guest_stay_dates';
const doDeploy = process.argv.includes('--deploy');

function refOf(url) {
  if (!url) return null;
  const m =
    url.match(/postgres\.([a-z0-9]+)/i) ||
    url.match(/([a-z0-9]+)\.supabase\.co/i);
  return m ? m[1] : null;
}

const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
if (urls.length < 2) {
  console.error('STOP: DATABASE_URL and DIRECT_URL required');
  process.exit(2);
}

for (const u of urls) {
  const ref = refOf(u);
  if (ref === PROD || (u && u.includes(PROD))) {
    console.error('STOP: production ref detected — refusing Gate 3 staging validate');
    process.exit(2);
  }
  if (!u.includes(STG) && ref !== STG) {
    console.error('STOP: staging ref missing — refusing non-staging target', {
      ref: ref || 'unknown',
    });
    process.exit(2);
  }
}

async function columnProbe(prisma) {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Job'
      AND column_name IN ('guestCheckInDate', 'guestCheckOutDate', 'preferredDate')
    ORDER BY column_name
  `);
  const indexes = await prisma.$queryRawUnsafe(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'Job'
      AND indexname IN ('Job_guestCheckInDate_idx', 'Job_guestCheckOutDate_idx')
    ORDER BY indexname
  `);
  const mig = await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at, rolled_back_at
     FROM "_prisma_migrations"
     WHERE migration_name = $1`,
    MIGRATION
  );
  return { cols, indexes, mig };
}

async function exerciseLegacyToStructured(prisma) {
  const id = `gate3-stay-dates-${Date.now()}`;
  const results = { id, steps: [] };

  try {
    const sample = await prisma.job.findFirst({
      select: { branchId: true, customerId: true, propertyId: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!sample?.branchId) {
      results.steps.push({
        step: 'sample',
        ok: false,
        note: 'no Job sample for FK clone',
      });
      return results;
    }

    await prisma.job.create({
      data: {
        id,
        branchId: sample.branchId,
        customerId: sample.customerId,
        propertyId: sample.propertyId,
        preferredDate: new Date('2026-10-05T00:00:00.000Z'),
        guestCheckInDate: null,
        guestCheckOutDate: null,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        currency: 'USD',
        internalNotes: '[Gate3 ephemeral — safe to delete]',
      },
    });
    results.steps.push({ step: 'insert_legacy_null_checkout', ok: true });

    const legacy = await prisma.job.findUnique({
      where: { id },
      select: {
        preferredDate: true,
        guestCheckInDate: true,
        guestCheckOutDate: true,
      },
    });
    results.steps.push({
      step: 'read_legacy',
      ok:
        legacy?.preferredDate?.toISOString() === '2026-10-05T00:00:00.000Z' &&
        legacy.guestCheckInDate == null &&
        legacy.guestCheckOutDate == null,
      preferredDate: legacy?.preferredDate?.toISOString() ?? null,
      guestCheckOutDate: legacy?.guestCheckOutDate ?? null,
    });

    await prisma.job.update({
      where: { id },
      data: {
        guestCheckInDate: new Date('2026-10-01T00:00:00.000Z'),
        guestCheckOutDate: new Date('2026-10-04T00:00:00.000Z'),
        preferredDate: new Date('2026-10-05T00:00:00.000Z'),
      },
    });
    results.steps.push({ step: 'patch_structured_dates', ok: true });

    const structured = await prisma.job.findUnique({
      where: { id },
      select: {
        preferredDate: true,
        guestCheckInDate: true,
        guestCheckOutDate: true,
      },
    });
    results.steps.push({
      step: 'read_structured',
      ok:
        structured?.preferredDate?.toISOString() === '2026-10-05T00:00:00.000Z' &&
        structured?.guestCheckInDate?.toISOString() ===
          '2026-10-01T00:00:00.000Z' &&
        structured?.guestCheckOutDate?.toISOString() ===
          '2026-10-04T00:00:00.000Z',
      preferredDate: structured?.preferredDate?.toISOString() ?? null,
      guestCheckInDate: structured?.guestCheckInDate?.toISOString() ?? null,
      guestCheckOutDate: structured?.guestCheckOutDate?.toISOString() ?? null,
    });

    await prisma.job.update({
      where: { id },
      data: { guestCheckOutDate: null },
    });
    const cleared = await prisma.job.findUnique({
      where: { id },
      select: { guestCheckOutDate: true, preferredDate: true },
    });
    results.steps.push({
      step: 'clear_checkout_null',
      ok:
        cleared?.guestCheckOutDate == null &&
        cleared?.preferredDate?.toISOString() === '2026-10-05T00:00:00.000Z',
    });
  } finally {
    await prisma.job.deleteMany({ where: { id } }).catch(() => {});
    results.steps.push({ step: 'cleanup_delete', ok: true });
  }

  results.ok = results.steps.every((s) => s.ok !== false);
  return results;
}

async function main() {
  console.log(
    JSON.stringify({
      gate: 'GATE3',
      migration: MIGRATION,
      target: 'staging',
      deploy: doDeploy,
      refsOk: true,
    })
  );

  if (doDeploy) {
    console.log('=== prisma migrate deploy (staging) ===');
    const r = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
      encoding: 'utf8',
      shell: true,
      env: process.env,
    });
    process.stdout.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
    if (r.status !== 0) {
      console.error('STOP: migrate deploy failed on staging');
      process.exit(r.status || 1);
    }
  } else {
    console.log('=== prisma migrate status (staging, no deploy) ===');
    const r = spawnSync('npx', ['prisma', 'migrate', 'status'], {
      encoding: 'utf8',
      shell: true,
      env: process.env,
    });
    process.stdout.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
  }

  const prisma = new PrismaClient();
  try {
    const probe = await columnProbe(prisma);
    const hasIn = probe.cols.some((c) => c.column_name === 'guestCheckInDate');
    const hasOut = probe.cols.some((c) => c.column_name === 'guestCheckOutDate');
    const hasPref = probe.cols.some((c) => c.column_name === 'preferredDate');
    const idxOk = probe.indexes.length === 2;
    const migApplied =
      Array.isArray(probe.mig) &&
      probe.mig.length === 1 &&
      probe.mig[0].finished_at != null &&
      probe.mig[0].rolled_back_at == null;

    console.log(
      JSON.stringify(
        {
          columnProbe: {
            guestCheckInDate: hasIn,
            guestCheckOutDate: hasOut,
            preferredDate: hasPref,
            indexes: probe.indexes.map((i) => i.indexname),
            migrationApplied: migApplied,
            columns: probe.cols,
          },
        },
        null,
        2
      )
    );

    if (!hasIn || !hasOut || !hasPref || !idxOk || !migApplied) {
      if (!doDeploy) {
        console.error(
          'STOP: columns/migration not present on staging — re-run with --deploy'
        );
        process.exit(3);
      }
      console.error('STOP: post-deploy verification failed');
      process.exit(1);
    }

    const exercise = await exerciseLegacyToStructured(prisma);
    console.log(JSON.stringify({ exercise }, null, 2));
    if (!exercise.ok) {
      console.error('STOP: legacy→structured exercise failed');
      process.exit(1);
    }

    console.log('GATE3_STAGING_MIGRATE_VALIDATE: PASS');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('STOP:', err instanceof Error ? err.message : err);
  process.exit(1);
});
