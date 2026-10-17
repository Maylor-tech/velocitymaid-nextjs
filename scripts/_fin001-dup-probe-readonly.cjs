/**
 * FIN-001 readonly duplicate probe — run before applying
 * prisma/migrations/20261016000000_fin001_payment_reconciliation on staging/prod.
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- node scripts/_fin001-dup-probe-readonly.cjs
 *
 * Does NOT modify any data.
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const stripeDups = await prisma.$queryRaw`
      SELECT "stripeSessionId" AS key, COUNT(*)::int AS cnt
      FROM "InvoicePayment"
      WHERE "stripeSessionId" IS NOT NULL
      GROUP BY "stripeSessionId"
      HAVING COUNT(*) > 1
    `;
    const refDups = await prisma.$queryRaw`
      SELECT "transactionReference" AS key, COUNT(*)::int AS cnt
      FROM "InvoicePayment"
      WHERE "transactionReference" IS NOT NULL
      GROUP BY "transactionReference"
      HAVING COUNT(*) > 1
    `;
    const ledgerDups = await prisma.$queryRaw`
      SELECT "referenceId", "referenceType", COUNT(*)::int AS cnt
      FROM "TransactionLedger"
      WHERE "referenceId" IS NOT NULL AND "referenceType" IS NOT NULL
      GROUP BY "referenceId", "referenceType"
      HAVING COUNT(*) > 1
    `;

    console.log(
      JSON.stringify(
        {
          stripeSessionIdDuplicates: stripeDups,
          transactionReferenceDuplicates: refDups,
          transactionLedgerDuplicates: ledgerDups,
          ok:
            stripeDups.length === 0 &&
            refDups.length === 0 &&
            ledgerDups.length === 0,
        },
        null,
        2
      )
    );

    if (stripeDups.length || refDups.length || ledgerDups.length) {
      process.exitCode = 2;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
