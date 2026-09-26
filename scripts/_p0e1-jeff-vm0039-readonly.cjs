/**
 * P0-E1 read-only — Jeff / VM-2026-0039 billing policy + ASSIGNED status probe.
 * No mutations. Production DATABASE_URL only.
 */
const { PrismaClient } = require('@prisma/client');
const PROD_REF = 'chsahtnpwssyfrqzcncz';
const STAGING_REF = 'wfudxrziqyfvrdgnocky';
const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
if (!urls.length || urls.some((u) => u.includes(STAGING_REF)) || !urls.every((u) => u.includes(PROD_REF))) {
  console.error('STOP: Production-only guard failed');
  process.exit(2);
}
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

function money(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

async function main() {
  const job = await prisma.job.findFirst({
    where: { jobReference: 'VM-2026-0039' },
    select: {
      id: true,
      jobReference: true,
      status: true,
      paymentStatus: true,
      billingPolicy: true,
      quotedTotal: true,
      totalPrice: true,
      amountPaid: true,
      balanceDue: true,
      completedAt: true,
      completedBy: true,
      assignedCleanerId: true,
      assignedAt: true,
      startedAt: true,
      notifiedAt: true,
      preferredDate: true,
      serviceType: true,
      customerName: true,
      customerId: true,
      internalNotes: true,
      createdAt: true,
      Customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          billingPolicy: true,
        },
      },
      Invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          amountPaid: true,
          balanceDue: true,
          sentAt: true,
          paidAt: true,
          createdAt: true,
          publicToken: true,
        },
      },
      CompletionReport: { select: { id: true, status: true, sentAt: true, createdAt: true } },
      JobOffer: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, status: true, createdAt: true, respondedAt: true },
      },
    },
  });

  if (!job) {
    console.log(JSON.stringify({ ok: false, error: 'VM-2026-0039 not found' }, null, 2));
    return;
  }

  // Other Jeff jobs for billing-policy pattern
  const siblingJobs = job.customerId
    ? await prisma.job.findMany({
        where: { customerId: job.customerId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          jobReference: true,
          status: true,
          paymentStatus: true,
          billingPolicy: true,
          preferredDate: true,
          completedAt: true,
          Invoice: { select: { invoiceNumber: true, status: true, total: true } },
        },
      })
    : [];

  const audit = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityId: job.id },
        ...(job.Invoice ? [{ entityId: job.Invoice.id }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: {
      action: true,
      description: true,
      createdAt: true,
      actorRole: true,
      changes: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        job: {
          ...job,
          quotedTotal: money(job.quotedTotal),
          totalPrice: money(job.totalPrice),
          amountPaid: money(job.amountPaid),
          balanceDue: money(job.balanceDue),
          Invoice: job.Invoice
            ? {
                ...job.Invoice,
                total: money(job.Invoice.total),
                amountPaid: money(job.Invoice.amountPaid),
                balanceDue: money(job.Invoice.balanceDue),
                // do not print full public token in logs beyond presence
                publicTokenPresent: Boolean(job.Invoice.publicToken),
                publicToken: undefined,
              }
            : null,
        },
        customerBillingPolicy: job.Customer?.billingPolicy ?? null,
        jobBillingPolicy: job.billingPolicy,
        siblingJobs: siblingJobs.map((j) => ({
          ...j,
          Invoice: j.Invoice
            ? { ...j.Invoice, total: money(j.Invoice.total) }
            : null,
        })),
        recentAudit: audit,
        findingsHints: {
          assignedWithoutCompletedAt: job.status === 'ASSIGNED' && !job.completedAt,
          invoiceSentWhileAssigned:
            job.status === 'ASSIGNED' && job.Invoice?.status === 'SENT',
          customerPrepayWithSentInvoice:
            job.Customer?.billingPolicy === 'PREPAY' &&
            job.Invoice &&
            Number(job.Invoice.balanceDue) > 0,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
