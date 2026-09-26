/**
 * P0-E1A — guarded production migrate for invoice_checkout_sessions only.
 * Refuses unless DATABASE_URL/DIRECT_URL are production ref.
 * Does not mutate Jeff / VM-2026-0039 rows (DDL only).
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- node scripts/p0e1a-prod-migrate.cjs
 *   npx dotenv-cli -e .env.local -- node scripts/p0e1a-prod-migrate.cjs --verify-only
 */
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const PROD = 'chsahtnpwssyfrqzcncz';
const STG = 'wfudxrziqyfvrdgnocky';
const MIGRATION = '20260926180000_invoice_checkout_session';
const verifyOnly = process.argv.includes('--verify-only');

const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
if (urls.length < 2) {
  console.error('STOP: DATABASE_URL and DIRECT_URL required');
  process.exit(2);
}
for (const u of urls) {
  if (u.includes(STG)) {
    console.error('STOP: staging ref detected — refusing production migrate');
    process.exit(2);
  }
  if (!u.includes(PROD)) {
    console.error('STOP: production ref missing');
    process.exit(2);
  }
}

async function verifyTable(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoice_checkout_sessions'
    ORDER BY ordinal_position
  `);
  const indexes = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'invoice_checkout_sessions'
    ORDER BY indexname
  `);
  const mig = await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at, rolled_back_at
     FROM "_prisma_migrations"
     WHERE migration_name = $1`,
    MIGRATION
  );
  const jeff = await prisma.invoice.findFirst({
    where: { invoiceNumber: 'VM-2026-0039' },
    select: {
      invoiceNumber: true,
      status: true,
      total: true,
      amountPaid: true,
      balanceDue: true,
      _count: { select: { payments: true, checkoutSessions: true } },
    },
  });

  return {
    migrationRow: mig,
    columns: rows,
    indexes,
    jeffUnchanged: jeff
      ? {
          invoiceNumber: jeff.invoiceNumber,
          status: jeff.status,
          total: Number(jeff.total),
          amountPaid: Number(jeff.amountPaid),
          balanceDue: Number(jeff.balanceDue),
          paymentCount: jeff._count.payments,
          checkoutSessionCount: jeff._count.checkoutSessions,
        }
      : null,
  };
}

async function main() {
  console.log(
    JSON.stringify({
      guard: 'production-migrate-only',
      target: PROD,
      migration: MIGRATION,
      verifyOnly,
      command: verifyOnly ? 'verify' : 'prisma migrate deploy',
    })
  );

  if (!verifyOnly) {
    const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    if ((result.status ?? 1) !== 0) {
      console.error('STOP: migrate deploy failed — do not deploy app');
      process.exit(result.status ?? 1);
    }
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  try {
    const report = await verifyTable(prisma);
    const colNames = (report.columns || []).map((c) => c.column_name);
    const required = [
      'id',
      'invoiceId',
      'stripeSessionId',
      'amountCents',
      'status',
      'createdAt',
      'expiredAt',
      'completedAt',
      'capturedAmountCents',
      'reconciliationNote',
    ];
    const missing = required.filter((c) => !colNames.includes(c));
    const hasUniqueSession = (report.indexes || []).some(
      (i) =>
        String(i.indexname).includes('stripeSessionId') ||
        String(i.indexdef).includes('stripeSessionId')
    );

    console.log(JSON.stringify({ ok: missing.length === 0 && hasUniqueSession, missing, hasUniqueSession, ...report }, null, 2));

    if (missing.length || !hasUniqueSession) {
      console.error('STOP: table verification failed');
      process.exit(2);
    }
    if (
      report.jeffUnchanged &&
      (report.jeffUnchanged.balanceDue !== 225 ||
        report.jeffUnchanged.paymentCount !== 0 ||
        report.jeffUnchanged.status !== 'SENT')
    ) {
      console.error('STOP: Jeff invoice unexpectedly changed during migration verify');
      process.exit(2);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
