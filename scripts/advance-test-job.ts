import { JobStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { resolveCompletionPaymentUpdate } from '../lib/booking/jobPayment';

/**
 * Move one assigned deposit job to today and optionally mark COMPLETED + BALANCE_DUE
 * so the full loop can be tested without waiting for June 2026.
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/advance-test-job.ts
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/advance-test-job.ts --complete
 */
async function main() {
  const complete = process.argv.includes('--complete');
  const customerHint = process.argv.find((a) => a.startsWith('--customer='))?.split('=')[1];

  let job = await prisma.job.findFirst({
    where: {
      status: JobStatus.ASSIGNED,
      assignedCleanerId: { not: null },
      paymentStatus: PaymentStatus.DEPOSIT_PAID,
      NOT: { JobPayout: { status: 'PAID' } },
      ...(customerHint
        ? { customerName: { contains: customerHint, mode: 'insensitive' } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      Customer: { select: { email: true, firstName: true } },
      User: { select: { email: true, name: true } },
      JobPayout: { select: { status: true } },
    },
  });

  if (!job) {
    job = await prisma.job.findFirst({
      where: {
        status: JobStatus.ASSIGNED,
        assignedCleanerId: { not: null },
        paymentStatus: PaymentStatus.DEPOSIT_PAID,
        NOT: { JobPayout: { status: 'PAID' } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Customer: { select: { email: true, firstName: true } },
        User: { select: { email: true, name: true } },
        JobPayout: { select: { status: true } },
      },
    });
  }

  if (!job) {
    console.log('No ASSIGNED deposit job found. Assign a cleaner in admin first.');
    return;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const updates: Parameters<typeof prisma.job.update>[0]['data'] = {
    preferredDate: today,
    preferredTime: '09:00-12:00',
  };

  if (complete) {
    const paymentUpdate = resolveCompletionPaymentUpdate(
      job.paymentStatus,
      {
        quotedTotal: job.quotedTotal ? Number(job.quotedTotal) : null,
        totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
        amountPaid: job.amountPaid ? Number(job.amountPaid) : null,
      },
      { payoutStatus: job.JobPayout?.status ?? null }
    );
    Object.assign(updates, {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      ...(paymentUpdate ?? {}),
    });
  }

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: updates,
  });

  console.log('\n✅ Test job updated');
  console.log(`   Job ID: ${updated.id}`);
  console.log(`   Customer: ${job.customerName} (${job.Customer?.email ?? 'no email'})`);
  console.log(`   Cleaner: ${job.User?.name} (${job.User?.email})`);
  console.log(`   Date: today · ${updated.preferredTime}`);
  console.log(`   Status: ${updated.status} · Payment: ${updated.paymentStatus}`);
  if (updated.balanceDue) {
    console.log(`   Balance due: $${Number(updated.balanceDue).toFixed(2)}`);
  }
  console.log('\n🔗 Links');
  console.log(`   Admin:  http://localhost:3000/admin/jobs/${updated.id}`);
  console.log(`   Cleaner: http://localhost:3000/cleaner/jobs/${updated.id}`);
  console.log(`   Customer: http://localhost:3000/customer/jobs/${updated.id}`);
  if (!complete) {
    console.log('\nNext: cleaner login → Accept → Start → Complete');
    console.log('Or: npx dotenv-cli -e .env.local -- npx tsx scripts/advance-test-job.ts --complete');
  } else {
    console.log('\nNext: customer logs in → Pay Remaining Balance');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
