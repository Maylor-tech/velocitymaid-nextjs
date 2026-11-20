/**
 * Staging-only cleaner compensation fixtures.
 *
 *   DISPATCH_STAGING=true
 *   DISPATCH_STAGING_DB_CONFIRMED=true
 *   npx dotenv-cli -e .env.staging -- npx tsx scripts/seed-cleaner-comp-staging.ts
 *
 * Refuses the production project. Does not email anyone.
 */
import { BranchStatus, CompensationBasis, JobOfferStatus, JobStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  PRODUCTION_SUPABASE_PROJECT_REF,
  stagingScriptRefuseReason,
} from '../lib/dispatch/environmentSafety';

const STAGING_PROJECT_REF = 'wfudxrziqyfvrdgnocky';
const LABEL = 'STAGING TEST — DO NOT SERVICE';
const CLEANER_EMAIL = 'dorothy.staging@example.test';

function refuseIfUnsafe() {
  const reason = stagingScriptRefuseReason();
  if (reason) throw new Error(reason);
  const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean).join(' ');
  if (urls.includes(PRODUCTION_SUPABASE_PROJECT_REF)) {
    throw new Error('Refusing: production database.');
  }
  if (!urls.includes(STAGING_PROJECT_REF)) {
    throw new Error('Refusing: database is not the staging project.');
  }
}

async function main() {
  refuseIfUnsafe();
  const now = new Date('2026-11-19T15:00:00.000Z');
  const branch = await prisma.branch.upsert({
    where: { slug: 'vermont-staging' },
    update: { updatedAt: now },
    create: {
      id: 'branch-staging-vermont',
      name: `${LABEL} Vermont`,
      slug: 'vermont-staging',
      country: 'US',
      state: 'VT',
      city: 'Ludlow',
      timezone: 'America/New_York',
      primaryPhone: '+18025550100',
      whatsappNumber: '+18025550100',
      status: BranchStatus.ACTIVE,
      updatedAt: now,
    },
  });

  const cleaner = await prisma.user.upsert({
    where: { email: CLEANER_EMAIL },
    update: {
      name: 'Dorothy Staging',
      role: UserRole.CLEANER,
      isActive: true,
      primaryBranchId: branch.id,
      updatedAt: now,
    },
    create: {
      id: 'user-staging-dorothy',
      email: CLEANER_EMAIL,
      name: 'Dorothy Staging',
      role: UserRole.CLEANER,
      isActive: true,
      primaryBranchId: branch.id,
      updatedAt: now,
    },
  });

  const jobs = [
    {
      id: 'job-staging-comp-solo',
      reference: 'VM-STAGING-COMP-SOLO',
      method: 'PERCENTAGE' as const,
      rate: 65,
      assisted: false,
      base: 390,
      hours: null as number | null,
      day: '2026-11-18',
      payable: { expected: 253.5, paid: 0, balance: 253.5, status: 'OWED' as const },
    },
    {
      id: 'job-staging-comp-assist',
      reference: 'VM-STAGING-COMP-ASSIST',
      method: 'HOURLY' as const,
      rate: 30,
      assisted: true,
      base: 390,
      hours: 4.5,
      day: '2026-11-18',
      payable: { expected: 135, paid: 0, balance: 135, status: 'OWED' as const },
    },
    {
      id: 'job-staging-comp-hours',
      reference: 'VM-STAGING-COMP-HOURS',
      method: 'HOURLY' as const,
      rate: 30,
      assisted: true,
      base: 390,
      hours: null,
      day: '2026-11-19',
      payable: null,
    },
    {
      id: 'job-staging-comp-paid',
      reference: 'VM-STAGING-COMP-PAID',
      method: 'PERCENTAGE' as const,
      rate: 65,
      assisted: false,
      base: 390,
      hours: null,
      day: '2026-11-17',
      payable: { expected: 253.5, paid: 253.5, balance: 0, status: 'PAID_MANUALLY' as const },
    },
  ];

  for (const job of jobs) {
    const completedAt = new Date(`${job.day}T18:00:00.000Z`);
    const startedAt = new Date(`${job.day}T13:30:00.000Z`);
    await prisma.job.upsert({
      where: { id: job.id },
      update: {
        status: JobStatus.COMPLETED,
        assignedCleanerId: cleaner.id,
        agreedOperationalPrice: job.base,
        completedAt,
        startedAt,
        customerName: LABEL,
      },
      create: {
        id: job.id,
        jobReference: job.reference,
        branchId: branch.id,
        assignedCleanerId: cleaner.id,
        customerName: LABEL,
        address: LABEL,
        serviceType: 'Turnover',
        status: JobStatus.COMPLETED,
        agreedOperationalPrice: job.base,
        preferredDate: new Date(`${job.day}T00:00:00.000Z`),
        startedAt,
        completedAt,
      },
    });

    const offerId = `offer-${job.id}`;
    await prisma.jobOffer.upsert({
      where: { id: offerId },
      update: {
        status: JobOfferStatus.ACCEPTED,
        compensationAmount: job.method === 'HOURLY' ? job.rate : job.payable?.expected ?? job.rate,
        compensationBasis: job.method === 'HOURLY' ? CompensationBasis.HOURLY : CompensationBasis.OTHER,
      },
      create: {
        id: offerId,
        jobId: job.id,
        cleanerId: cleaner.id,
        status: JobOfferStatus.ACCEPTED,
        offeredAt: startedAt,
        expiresAt: completedAt,
        respondedAt: startedAt,
        compensationAmount: job.method === 'HOURLY' ? job.rate : job.payable?.expected ?? job.rate,
        compensationCurrency: 'USD',
        compensationBasis: job.method === 'HOURLY' ? CompensationBasis.HOURLY : CompensationBasis.OTHER,
      },
    });

    await prisma.compensationAgreement.upsert({
      where: { jobOfferId: offerId },
      update: {
        rate: job.rate,
        verifiedHours: job.hours,
        hoursVerifiedBy: job.hours == null ? null : 'staging-seed',
        hoursVerifiedAt: job.hours == null ? null : now,
        frozenAt: completedAt,
      },
      create: {
        id: `agreement-${job.id}`,
        jobOfferId: offerId,
        jobId: job.id,
        cleanerId: cleaner.id,
        method: job.method,
        rate: job.rate,
        eligibleBase: job.base,
        assisted: job.assisted,
        setBy: 'staging-seed',
        setAt: startedAt,
        note: LABEL,
        frozenAt: completedAt,
        verifiedHours: job.hours,
        hoursVerifiedBy: job.hours == null ? null : 'staging-seed',
        hoursVerifiedAt: job.hours == null ? null : now,
      },
    });

    if (job.payable) {
      await prisma.cleanerPayable.upsert({
        where: { jobId_cleanerId: { jobId: job.id, cleanerId: cleaner.id } },
        update: job.payable,
        create: {
          id: `payable-${job.id}`,
          jobId: job.id,
          cleanerId: cleaner.id,
          ...job.payable,
        },
      });
    }
  }

  await prisma.manualPayment.upsert({
    where: { id: 'payment-staging-comp-paid' },
    update: {},
    create: {
      id: 'payment-staging-comp-paid',
      cleanerId: cleaner.id,
      paidOn: new Date('2026-11-17T00:00:00.000Z'),
      amount: 253.5,
      method: 'ZELLE',
      memo: 'Staging test — disregard',
      recordedBy: 'staging-seed',
      allocations: {
        create: {
          id: 'allocation-staging-comp-paid',
          jobId: 'job-staging-comp-paid',
          amount: 253.5,
        },
      },
    },
  });

  console.log('Seeded staging cleaner compensation fixtures for Dorothy Staging. No email was sent.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Seed failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
