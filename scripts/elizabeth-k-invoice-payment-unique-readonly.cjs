/**
 * READ-ONLY: would the InvoicePayment unique index conflict?
 * SELECT only. Refuses unless DATABASE_URL is Production.
 * Never writes. Never migrate deploy.
 */
try {
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config({ path: '.env' });
} catch (_) {
  /* optional */
}

const { PrismaClient } = require('@prisma/client');

const PROD_REF = 'chsahtnpwssyfrqzcncz';
const STAGING_REF = 'wfudxrziqyfvrdgnocky';

const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
if (!urls.length) {
  console.error('STOP: no DB URL');
  process.exit(2);
}
if (urls.some((u) => String(u).includes(STAGING_REF))) {
  console.error('STOP: staging URL passed to prod-readonly script');
  process.exit(2);
}
if (!urls.every((u) => String(u).includes(PROD_REF))) {
  console.error('STOP: expected Production ref not found');
  process.exit(2);
}

const prisma = new PrismaClient();

async function main() {
  const compositeDupes = await prisma.$queryRaw`
    SELECT "invoiceId", "transactionReference", COUNT(*)::int AS n
    FROM "InvoicePayment"
    WHERE "transactionReference" IS NOT NULL
    GROUP BY "invoiceId", "transactionReference"
    HAVING COUNT(*) > 1
  `;

  const globalPiDupes = await prisma.$queryRaw`
    SELECT "transactionReference", COUNT(*)::int AS n
    FROM "InvoicePayment"
    WHERE "transactionReference" IS NOT NULL
    GROUP BY "transactionReference"
    HAVING COUNT(*) > 1
  `;

  const nullRefs = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS n
    FROM "InvoicePayment"
    WHERE "transactionReference" IS NULL
  `;

  const elizabethPi = await prisma.invoicePayment.findMany({
    where: {
      OR: [
        { transactionReference: 'pi_3UMZs9RqPKxN0h8W1cV0LYQg' },
        { stripeSessionId: 'pi_3UMZs9RqPKxN0h8W1cV0LYQg' },
      ],
    },
    select: { id: true, invoiceId: true, transactionReference: true, stripeSessionId: true, amount: true },
  });

  console.log(
    JSON.stringify(
      {
        readonly: true,
        writes: false,
        compositeInvoicePiDuplicates: compositeDupes,
        globalPaymentIntentDuplicates: globalPiDupes,
        nullTransactionReferenceCount: nullRefs,
        elizabethDepositPiRows: elizabethPi,
        migrationSafe:
          Array.isArray(compositeDupes) &&
          compositeDupes.length === 0,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
