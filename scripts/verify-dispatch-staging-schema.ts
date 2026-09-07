/**
 * Read-only schema check for a staging database. Does not write rows.
 *
 *   DISPATCH_STAGING=true DISPATCH_STAGING_DB_CONFIRMED=true
 *   npx dotenv-cli -e .env.staging -- npx tsx scripts/verify-dispatch-staging-schema.ts
 */
import { prisma } from '../lib/prisma';
import { stagingScriptRefuseReason } from '../lib/dispatch/environmentSafety';

function refuseIfUnsafe() {
  const reason = stagingScriptRefuseReason();
  if (reason) throw new Error(reason);
}

async function main() {
  refuseIfUnsafe();

  const checks = {
    JobOffer: await prisma.jobOffer.findMany({ take: 1, select: { id: true, expiresAt: true, status: true, compensationBasis: true } }),
    Job: await prisma.job.findMany({ take: 1, select: { id: true, billingPolicy: true, dispatchUrgency: true } }),
    User: await prisma.user.findMany({ take: 1, select: { id: true, role: true } }),
    Branch: await prisma.branch.findMany({ take: 1, select: { id: true, slug: true } }),
    Customer: await prisma.customer.findMany({ take: 1, select: { id: true, billingPolicy: true } }),
    Property: await prisma.property.findMany({ take: 1, select: { id: true, billingPolicy: true } }),
    CleanerProfile: await prisma.cleanerProfile.findMany({ take: 1, select: { userId: true } }),
    Invoice: await prisma.invoice.findMany({ take: 1, select: { id: true } }),
    AuditLog: await prisma.auditLog.findMany({ take: 1, select: { id: true } }),
  };

  console.log(JSON.stringify({
    ok: true,
    models: Object.keys(checks),
    note: 'Delegates resolved. Apply `npx prisma migrate deploy` on staging if a query fails.',
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
