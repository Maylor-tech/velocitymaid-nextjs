/**
 * Staging-only import of the confirmed cleaner-payment ledger.
 *
 *   DISPATCH_STAGING=true
 *   DISPATCH_STAGING_DB_CONFIRMED=true
 *   npx dotenv-cli -e .env.staging -- npx tsx scripts/import-cleaner-payments-staging.ts
 *
 * Refuses production. Does not email anyone. A second run creates nothing.
 */
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { BranchStatus, CompensationBasis, JobOfferStatus, JobStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  PRODUCTION_SUPABASE_PROJECT_REF,
  stagingScriptRefuseReason,
} from '../lib/dispatch/environmentSafety';
import { cleanerRows, planCleanerPaymentImport, type CleanerIdentity } from '../lib/cleanerComp/importHistory';

const STAGING_PROJECT_REF = 'wfudxrziqyfvrdgnocky';
const LABEL = 'STAGING HISTORY — DO NOT SERVICE';
const CSV_PATH = path.join(process.cwd(), 'scripts', '_local', 'cleaner-payments-confirmed-2026-11-19.csv');

const HISTORY_TERMS: { match: RegExp; effectiveFrom: string }[] = [
  { match: /dory|dori/i, effectiveFrom: '2026-10-09' },
  { match: /aurora/i, effectiveFrom: '2026-11-04' },
];

function refuseIfUnsafe() {
  const reason = stagingScriptRefuseReason();
  if (reason) throw new Error(reason);
  const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean).join(' ');
  if (urls.includes(PRODUCTION_SUPABASE_PROJECT_REF)) throw new Error('Refusing: production database.');
  if (!urls.includes(STAGING_PROJECT_REF)) throw new Error('Refusing: database is not the staging project.');
}

function emailFor(name: string, email: string): string {
  if (email.trim()) return email.trim().toLowerCase();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cleaner';
  return `history.${slug}@example.test`;
}

async function main() {
  refuseIfUnsafe();
  if (!fs.existsSync(CSV_PATH)) throw new Error('Confirmed payment file was not found.');
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const now = new Date('2026-11-19T15:00:00.000Z');

  const branch = await prisma.branch.upsert({
    where: { slug: 'vermont-staging' },
    update: { updatedAt: now },
    create: {
      id: 'branch-staging-vermont',
      name: 'STAGING TEST — DO NOT SERVICE Vermont',
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

  const people = cleanerRows(csv);
  const cleaners: CleanerIdentity[] = [];
  const effectiveFrom: Record<string, string> = {};
  for (const person of people) {
    const email = emailFor(person.name, person.email);
    const existing = await prisma.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          id: `history-${randomUUID()}`,
          email,
          name: person.name,
          role: UserRole.CLEANER,
          isActive: true,
          primaryBranchId: branch.id,
          updatedAt: now,
        },
      }));
    cleaners.push({ id: user.id, name: user.name || person.name, email: user.email });
    const profile = await prisma.cleanerProfile.findUnique({ where: { userId: user.id } });
    if (!profile || profile.w9StatusOn == null) {
      await prisma.cleanerProfile.upsert({
        where: { userId: user.id },
        update: { w9Status: 'MISSING', w9StatusOn: null },
        create: { userId: user.id, w9Status: 'MISSING' },
      });
    }
    const termsRule = HISTORY_TERMS.find((rule) => rule.match.test(person.name) || rule.match.test(user.name || ''));
    if (termsRule) {
      effectiveFrom[user.id] = termsRule.effectiveFrom;
      const terms = await prisma.cleanerCompTerms.findFirst({
        where: {
          cleanerId: user.id,
          effectiveFrom: new Date(`${termsRule.effectiveFrom}T00:00:00.000Z`),
        },
      });
      if (!terms) {
        await prisma.cleanerCompTerms.create({
          data: {
            cleanerId: user.id,
            soloMethod: 'PERCENTAGE',
            soloRate: 65,
            assistedMethod: 'HOURLY',
            assistedRate: 30,
            effectiveFrom: new Date(`${termsRule.effectiveFrom}T00:00:00.000Z`),
            setBy: 'history-import',
            note: 'Entered from the confirmed ledger. Not a code default.',
          },
        });
      }
    }
  }

  const preview = planCleanerPaymentImport({
    csv,
    jobsByReference: {},
    cleaners,
    termsEffectiveFrom: effectiveFrom,
  });
  const jobsByReference: Record<string, { jobId: string; serviceDate: string; cleanerId: string }> = {};
  for (const row of preview.unmatched) {
    if (row.jobReference.startsWith('MATCH:')) continue;
    const found = await prisma.job.findUnique({
      where: { jobReference: row.jobReference },
      select: { id: true, preferredDate: true, completedAt: true },
    });
    if (found) {
      const serviceDate = (found.completedAt ?? found.preferredDate ?? new Date()).toISOString().slice(0, 10);
      jobsByReference[row.jobReference] = { jobId: found.id, serviceDate, cleanerId: row.cleanerId };
      continue;
    }
    const payment = preview.payments.find((item) => item.paymentKey === row.paymentKey);
    const day = payment?.date ?? '2026-08-01';
    const id = `history-${row.jobReference.toLowerCase()}`;
    const created = await prisma.job.create({
      data: {
        id,
        jobReference: row.jobReference,
        branchId: branch.id,
        assignedCleanerId: row.cleanerId,
        customerName: LABEL,
        address: LABEL,
        serviceType: 'Turnover',
        status: JobStatus.COMPLETED,
        preferredDate: new Date(`${day}T00:00:00.000Z`),
        completedAt: new Date(`${day}T18:00:00.000Z`),
      },
    });
    jobsByReference[row.jobReference] = { jobId: created.id, serviceDate: day, cleanerId: row.cleanerId };
  }

  const plan = planCleanerPaymentImport({
    csv,
    jobsByReference,
    cleaners,
    termsEffectiveFrom: effectiveFrom,
  });

  let paymentsCreated = 0;
  let reimbursementsCreated = 0;
  for (const payment of plan.payments) {
    const existing = await prisma.manualPayment.findUnique({ where: { paymentKey: payment.paymentKey } });
    if (existing) continue;
    await prisma.manualPayment.create({
      data: {
        id: payment.id,
        paymentKey: payment.paymentKey,
        cleanerId: payment.cleanerId,
        paidOn: new Date(`${payment.date}T00:00:00.000Z`),
        amount: payment.amount,
        method: payment.method,
        paidFromKind: payment.paidFromKind,
        paidFromLabel: payment.paidFromLabel,
        memo: payment.memo,
        recordedBy: 'history-import',
        allocations: {
          create: payment.allocations.map((allocation) => ({
            allocationType: allocation.type,
            jobId: allocation.jobId,
            amount: allocation.amount,
            memo: allocation.memo,
            jobReference: allocation.jobReference,
            payBasisNote: allocation.payBasisNote,
          })),
        },
      },
    });
    paymentsCreated += 1;
    if (payment.paidFromKind === 'PERSONAL_FUNDS' && payment.paidFromLabel) {
      await prisma.reimbursementOwed.create({
        data: {
          manualPaymentId: payment.id,
          personName: payment.paidFromLabel,
          amount: payment.amount,
        },
      });
      reimbursementsCreated += 1;
    }
  }

  for (const job of plan.jobs) {
    const agreement = await prisma.compensationAgreement.findFirst({
      where: { jobId: job.jobId, cleanerId: job.cleanerId },
    });
    if (agreement) continue;
    const offerId = `offer-history-${job.jobId}`;
    const hourly = job.agreement.method === 'HOURLY';
    await prisma.jobOffer.upsert({
      where: { id: offerId },
      update: {},
      create: {
        id: offerId,
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        status: JobOfferStatus.ACCEPTED,
        offeredAt: new Date(`${job.serviceDate}T12:00:00.000Z`),
        expiresAt: new Date(`${job.serviceDate}T18:00:00.000Z`),
        respondedAt: new Date(`${job.serviceDate}T12:00:00.000Z`),
        compensationAmount: job.agreement.rate,
        compensationCurrency: 'USD',
        compensationBasis: hourly ? CompensationBasis.HOURLY : CompensationBasis.OTHER,
        operationalNotes: 'History import. No offer email was sent.',
      },
    });
    await prisma.compensationAgreement.create({
      data: {
        jobOfferId: offerId,
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        method: job.agreement.method,
        rate: job.agreement.rate,
        eligibleBase: job.agreement.eligibleBase,
        payBasis: job.agreement.payBasis ?? 'TERMS',
        assisted: job.agreement.assisted,
        verifiedHours: job.agreement.verifiedHours,
        hoursVerifiedBy: job.agreement.hoursVerifiedBy,
        hoursVerifiedAt: job.agreement.hoursVerifiedAt ? new Date(job.agreement.hoursVerifiedAt) : null,
        frozenAt: new Date(`${job.serviceDate}T18:00:00.000Z`),
        setBy: 'history-import',
        note: LABEL,
      },
    });
    const expected = job.agreement.payBasis === 'HISTORICAL_AS_PAID' ? job.agreement.rate : job.agreement.rate;
    await prisma.cleanerPayable.create({
      data: {
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        expected,
        paid: expected,
        balance: 0,
        status: 'PAID_MANUALLY',
      },
    });
  }

  const settings = await prisma.cleanerPaySettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    await prisma.cleanerPaySettings.create({ data: { id: 'default', threshold1099: 2000 } });
  }

  console.log(
    `History import created ${paymentsCreated} payment(s) and ${reimbursementsCreated} reimbursement line(s). Unmatched rows: ${plan.unmatched.length}. No email was sent.`
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Import failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
