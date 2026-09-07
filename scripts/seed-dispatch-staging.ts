/**
 * Staging-only dispatch fixtures. Refuses Production and any unconfirmed database.
 *
 *   DISPATCH_STAGING=true
 *   DISPATCH_STAGING_DB_CONFIRMED=true
 *   npx dotenv-cli -e .env.staging -- npx tsx scripts/seed-dispatch-staging.ts
 *
 * Emails are @example.test only. Labels include STAGING TEST — DO NOT SERVICE.
 */
import { randomUUID } from 'crypto';
import {
  BillingPolicy,
  BranchStatus,
  CleanerApplicationStatus,
  CompensationBasis,
  CustomerRecordKind,
  DispatchUrgency,
  JobOfferStatus,
  JobStatus,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { stagingScriptRefuseReason } from '../lib/dispatch/environmentSafety';

const LABEL = 'STAGING TEST — DO NOT SERVICE';
const ADMIN_EMAIL = 'staging.admin@example.test';
const CUSTOMER_EMAIL = 'staging.customer@example.test';
const CLEANER_EMAIL = 'staging.cleaner@example.test';
const BRANCH_SLUG = 'vermont-staging';
const JOB_REFERENCE = 'VM-STAGING-0001';

function refuseIfUnsafe() {
  const reason = stagingScriptRefuseReason();
  if (reason) throw new Error(reason);
}

async function main() {
  refuseIfUnsafe();

  const now = new Date();
  const serviceDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 14));

  const branch = await prisma.branch.upsert({
    where: { slug: BRANCH_SLUG },
    update: {
      name: `${LABEL} Vermont`,
      status: BranchStatus.ACTIVE,
      updatedAt: now,
    },
    create: {
      id: 'branch-staging-vermont',
      name: `${LABEL} Vermont`,
      slug: BRANCH_SLUG,
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

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: `${LABEL} Admin`,
      role: UserRole.ADMIN,
      isActive: true,
      primaryBranchId: branch.id,
      updatedAt: now,
    },
    create: {
      id: 'user-staging-admin',
      email: ADMIN_EMAIL,
      name: `${LABEL} Admin`,
      role: UserRole.ADMIN,
      isActive: true,
      primaryBranchId: branch.id,
      updatedAt: now,
    },
  });

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: admin.id, branchId: branch.id } },
    update: {},
    create: {
      id: `ub-staging-admin-${branch.id}`,
      userId: admin.id,
      branchId: branch.id,
    },
  });

  const cleaner = await prisma.user.upsert({
    where: { email: CLEANER_EMAIL },
    update: {
      name: `${LABEL} Cleaner`,
      role: UserRole.CLEANER,
      isActive: true,
      primaryBranchId: branch.id,
      updatedAt: now,
    },
    create: {
      id: 'user-staging-cleaner',
      email: CLEANER_EMAIL,
      name: `${LABEL} Cleaner`,
      role: UserRole.CLEANER,
      isActive: true,
      primaryBranchId: branch.id,
      updatedAt: now,
    },
  });

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: cleaner.id, branchId: branch.id } },
    update: {},
    create: {
      id: `ub-staging-cleaner-${branch.id}`,
      userId: cleaner.id,
      branchId: branch.id,
    },
  });

  await prisma.cleanerProfile.upsert({
    where: { userId: cleaner.id },
    update: { publicDisplayName: LABEL, isInternalTeam: true },
    create: {
      userId: cleaner.id,
      publicDisplayName: LABEL,
      isInternalTeam: true,
    },
  });

  const existingApp = await prisma.cleanerApplication.findFirst({
    where: { email: CLEANER_EMAIL, branchId: branch.id },
  });
  if (existingApp) {
    await prisma.cleanerApplication.update({
      where: { id: existingApp.id },
      data: { status: CleanerApplicationStatus.APPROVED, name: LABEL, updatedAt: now },
    });
  } else {
    await prisma.cleanerApplication.create({
      data: {
        id: randomUUID(),
        name: LABEL,
        email: CLEANER_EMAIL,
        phone: '+18025550199',
        branchId: branch.id,
        status: CleanerApplicationStatus.APPROVED,
        updatedAt: now,
      },
    });
  }

  const customer = await prisma.customer.upsert({
    where: { email: CUSTOMER_EMAIL },
    update: {
      firstName: 'STAGING',
      lastName: 'TEST — DO NOT SERVICE',
      recordKind: CustomerRecordKind.TEST,
      billingPolicy: BillingPolicy.INVOICE_AFTER_SERVICE,
      branchId: branch.id,
      updatedAt: now,
    },
    create: {
      id: 'customer-staging-host',
      firstName: 'STAGING',
      lastName: 'TEST — DO NOT SERVICE',
      email: CUSTOMER_EMAIL,
      phone: '+18025550111',
      branchId: branch.id,
      recordKind: CustomerRecordKind.TEST,
      billingPolicy: BillingPolicy.INVOICE_AFTER_SERVICE,
      city: 'Ludlow',
      state: 'VT',
      updatedAt: now,
    },
  });

  const property =
    (await prisma.property.findFirst({
      where: { customerId: customer.id, name: LABEL },
    })) ??
    (await prisma.property.create({
      data: {
        customerId: customer.id,
        name: LABEL,
        address: '1 Staging Lane',
        city: 'Ludlow',
        state: 'VT',
        postalCode: '05149',
        billingPolicy: BillingPolicy.INVOICE_AFTER_SERVICE,
      },
    }));

  const job =
    (await prisma.job.findUnique({ where: { jobReference: JOB_REFERENCE } })) ??
    (await prisma.job.create({
      data: {
        id: 'job-staging-dispatch-1',
        jobReference: JOB_REFERENCE,
        branchId: branch.id,
        customerId: customer.id,
        propertyId: property.id,
        customerName: LABEL,
        preferredDate: serviceDate,
        preferredTime: '11:00 AM',
        serviceType: 'Vacation Rental Turnover',
        serviceLocation: 'Ludlow, VT',
        address: '1 Staging Lane, Ludlow, VT',
        status: JobStatus.RECEIVED,
        paymentStatus: PaymentStatus.PENDING,
        billingPolicy: BillingPolicy.INVOICE_AFTER_SERVICE,
        quotedTotal: 300,
        totalPrice: 300,
        operationalTotal: 200,
        estimatedDurationMins: 180,
        dispatchUrgency: DispatchUrgency.STANDARD,
        internalNotes: LABEL,
      },
    }));

  const existingOffer = await prisma.jobOffer.findFirst({
    where: { jobId: job.id, cleanerId: cleaner.id, status: JobOfferStatus.OFFERED },
  });
  const offer =
    existingOffer ??
    (await prisma.jobOffer.create({
      data: {
        jobId: job.id,
        cleanerId: cleaner.id,
        status: JobOfferStatus.OFFERED,
        expiresAt: new Date(now.getTime() + 120 * 60 * 1000),
        compensationAmount: 90,
        compensationCurrency: 'USD',
        compensationBasis: CompensationBasis.FLAT,
        estimatedDurationMins: 180,
        operationalNotes: LABEL,
        channel: 'PORTAL',
        createdByAdminId: admin.id,
      },
    }));

  console.log(JSON.stringify({
    ok: true,
    warning: LABEL,
    adminEmail: ADMIN_EMAIL,
    cleanerEmail: CLEANER_EMAIL,
    customerEmail: CUSTOMER_EMAIL,
    branchSlug: branch.slug,
    jobId: job.id,
    jobReference: job.jobReference,
    offerId: offer.id,
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
