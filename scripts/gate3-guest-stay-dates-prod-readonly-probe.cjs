/**
 * Gate 3 — production read-only probe: confirm guest stay columns are NOT yet
 * on production (migration still pending). Refuses staging. No DDL.
 *
 *   npx dotenv-cli -e .env.local -- node scripts/gate3-guest-stay-dates-prod-readonly-probe.cjs
 */
const { PrismaClient } = require('@prisma/client');

const PROD = 'chsahtnpwssyfrqzcncz';
const STG = 'wfudxrziqyfvrdgnocky';
const MIGRATION = '20260929120000_job_guest_stay_dates';

const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
if (urls.length < 1) {
  console.error('STOP: DATABASE_URL required');
  process.exit(2);
}
for (const u of urls) {
  if (u.includes(STG)) {
    console.error('STOP: staging ref — use staging validate script instead');
    process.exit(2);
  }
  if (!u.includes(PROD)) {
    console.error('STOP: production ref missing');
    process.exit(2);
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Job'
        AND column_name IN ('guestCheckInDate', 'guestCheckOutDate')
      ORDER BY column_name
    `);
    const mig = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at, rolled_back_at
       FROM "_prisma_migrations"
       WHERE migration_name = $1`,
      MIGRATION
    );
    const present = cols.map((c) => c.column_name);
    const report = {
      gate: 'GATE3_PROD_READONLY',
      migration: MIGRATION,
      columnsPresent: present,
      migrationRow: mig,
      expectAbsent: present.length === 0 && mig.length === 0,
    };
    console.log(JSON.stringify(report, null, 2));
    if (!report.expectAbsent) {
      console.error(
        'NOTE: migration already present on production — deploy sequencing may differ'
      );
      process.exit(4);
    }
    console.log('GATE3_PROD_READONLY: PASS (columns absent; migrate still required)');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('STOP:', e instanceof Error ? e.message : e);
  process.exit(1);
});
