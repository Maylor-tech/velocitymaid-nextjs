/**
 * Repair jobs where JobPayout is PAID but job.paymentStatus is not PAID.
 *
 * Local/staging only by default (--apply blocked in non-interactive / hosted production).
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/repair-paid-payout-payment-status.ts
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/repair-paid-payout-payment-status.ts -- --apply --force-local
 */

import { PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

function assertSafeToApply() {
  if (process.env.ALLOW_REPAIR_SCRIPT === '1') return;

  // Allow apply from an interactive local terminal (developer machine).
  if (process.stdin.isTTY) return;

  const onVercelProduction =
    process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';

  if (onVercelProduction) {
    console.error(
      'Refusing to apply on Vercel production. Use ALLOW_REPAIR_SCRIPT=1 to override (not recommended).'
    );
    process.exit(1);
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? '').toLowerCase();
  if (
    base.includes('velocitymaid.com') &&
    !base.includes('localhost') &&
    !base.includes('127.0.0.1')
  ) {
    console.error(
      'Refusing to apply with production NEXT_PUBLIC_BASE_URL. Use ALLOW_REPAIR_SCRIPT=1 to override.'
    );
    process.exit(1);
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const forceLocal = process.argv.includes('--force-local');

  if (apply && !forceLocal) {
    assertSafeToApply();
  }

  const mismatches = await prisma.job.findMany({
    where: {
      paymentStatus: { not: PaymentStatus.PAID },
      JobPayout: { status: 'PAID' },
    },
    select: {
      id: true,
      customerName: true,
      status: true,
      paymentStatus: true,
      balanceDue: true,
      amountPaid: true,
      quotedTotal: true,
      totalPrice: true,
      JobPayout: {
        select: { id: true, status: true, paidAt: true, cleanerAmount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (mismatches.length === 0) {
    console.log('No mismatched jobs (payout PAID + job not PAID).');
    return;
  }

  console.log(`Found ${mismatches.length} job(s) to repair:\n`);
  for (const job of mismatches) {
    const quoted = Number(job.quotedTotal ?? job.totalPrice ?? 0);
    console.log(`  ${job.id}`);
    console.log(`    customer: ${job.customerName ?? '—'}`);
    console.log(`    status: ${job.status} · payment: ${job.paymentStatus}`);
    console.log(
      `    payout: ${job.JobPayout?.status} · paidAt: ${job.JobPayout?.paidAt?.toISOString() ?? '—'}`
    );
    console.log(`    would set: paymentStatus=PAID, balanceDue=0, amountPaid=${quoted}`);
    console.log('');
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to repair.');
    return;
  }

  for (const job of mismatches) {
    const quoted = Number(job.quotedTotal ?? job.totalPrice ?? 0);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        balanceDue: 0,
        amountPaid: quoted,
      },
    });
    console.log(`✅ Repaired ${job.id}`);
  }

  console.log(`\nRepaired ${mismatches.length} job(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
