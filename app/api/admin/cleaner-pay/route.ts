import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import {
  agreedCleaningPrice,
  cleanerPayLabel,
  cleanerTermsFromRow,
  compensationMethodLabel,
  DEFAULT_1099_THRESHOLD,
  homeSizeExceptionLabel,
  reviewPayables,
  termsBoundary,
  termsInEffect,
  thresholdNotice,
  yearToDateTotal,
  type JobPayInput,
  type ManualPaymentInput,
} from '@/lib/cleanerComp/pay';

export const dynamic = 'force-dynamic';

function money(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function day(value: Date | null): string {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

function formatDay(value: string): string {
  if (!value) return '—';
  const [year, month, date] = value.split('-').map(Number);
  if (!year || !month || !date) return value;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatMoney(value: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

const STATUS_LABEL: Record<string, string> = {
  NEEDS_HOURS: 'Needs hours',
  NEEDS_RECONCILIATION: 'Needs reconciliation',
  PAID_MANUALLY: 'Paid manually',
  OWED: 'Owed',
  OVERPAID: 'Overpaid',
};

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const cleanerId = request.nextUrl.searchParams.get('cleanerId');
    const cleaners = await prisma.user.findMany({
      where: {
        OR: [{ CompensationAgreements: { some: {} } }, { ManualPayments: { some: {} } }],
        ...(cleanerId ? { id: cleanerId } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 1,
    });
    const cleaner = cleaners[0];
    if (!cleaner) {
      return NextResponse.json({
        success: true,
        cleanerName: 'No agreements yet',
        lines: [],
        payments: [],
        advances: [],
        reimbursements: [],
        unmatched: [],
        ytd: null,
        terms: null,
        w9Status: null,
      });
    }

    const agreements = await prisma.compensationAgreement.findMany({
      where: { cleanerId: cleaner.id },
      include: {
        Job: {
          select: {
            id: true,
            jobReference: true,
            preferredDate: true,
            completedAt: true,
            agreedOperationalPrice: true,
            agreedCustomerPrice: true,
            processingAllowanceEstimated: true,
            status: true,
          },
        },
      },
      orderBy: { setAt: 'desc' },
    });
    const payments = await prisma.manualPayment.findMany({
      where: { cleanerId: cleaner.id },
      include: { allocations: true },
      orderBy: { paidOn: 'desc' },
    });

    const paymentInputs: ManualPaymentInput[] = payments.map((payment) => ({
      id: payment.id,
      cleanerId: payment.cleanerId,
      date: day(payment.paidOn),
      amount: money(payment.amount) ?? 0,
      allocations: payment.allocations.map((allocation) => ({
        jobId: allocation.jobId,
        amount: money(allocation.amount) ?? 0,
        type: allocation.allocationType,
        memo: allocation.memo,
        appliedJobId: allocation.appliedJobId,
      })),
      paidFromKind: payment.paidFromKind,
      paidFromLabel: payment.paidFromLabel,
    }));

    const [terms, profile, settings, reimbursements, unmatched] = await Promise.all([
      prisma.cleanerCompTerms.findMany({
        where: { cleanerId: cleaner.id },
        orderBy: { effectiveFrom: 'asc' },
      }),
      prisma.cleanerProfile.findUnique({ where: { userId: cleaner.id }, select: { w9Status: true, w9StatusOn: true } }),
      prisma.cleanerPaySettings.findUnique({ where: { id: 'default' } }),
      prisma.reimbursementOwed.findMany({
        include: { ManualPayment: { select: { paidOn: true, memo: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.manualPaymentAllocation.findMany({
        where: { jobId: null, jobReference: { startsWith: 'MATCH:' } },
        include: { ManualPayment: { select: { cleanerId: true, paidOn: true, Cleaner: { select: { name: true } } } } },
        orderBy: { ManualPayment: { paidOn: 'desc' } },
      }),
    ]);

    const jobs: JobPayInput[] = agreements.map((agreement) => ({
      jobId: agreement.jobId,
      cleanerId: cleaner.id,
      serviceDate: day(agreement.Job.completedAt ?? agreement.Job.preferredDate),
      completed: agreement.Job.status === 'COMPLETED',
      agreedCleaningPrice: agreedCleaningPrice({
        agreedOperationalPrice: agreement.Job.agreedOperationalPrice,
        agreedCustomerPrice: agreement.Job.agreedCustomerPrice,
        processingAllowance: agreement.Job.processingAllowanceEstimated,
        includedAddOns: agreement.includedAddOns,
      }),
      tip: 0,
      termsEffectiveFrom: termsBoundary(
        terms.map((row) => ({ effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10) })),
        day(agreement.Job.completedAt ?? agreement.Job.preferredDate)
      ),
      agreement: {
        method: agreement.method,
        rate: money(agreement.rate) ?? 0,
        eligibleBase: money(agreement.eligibleBase),
        manualEligibleBase: agreement.manualEligibleBase,
        payBasis: agreement.payBasis,
        includedAddOns: agreement.includedAddOns,
        assisted: agreement.assisted,
        verifiedHours: money(agreement.verifiedHours),
        hoursVerifiedBy: agreement.hoursVerifiedBy,
        hoursVerifiedAt: agreement.hoursVerifiedAt?.toISOString() ?? null,
        frozenAt: agreement.frozenAt?.toISOString() ?? null,
      },
    }));

    const reviewed = reviewPayables({ jobs, payments: paymentInputs });
    const byJob = new Map(agreements.map((agreement) => [agreement.jobId, agreement]));
    const lines = reviewed.rows.map((row) => {
      const agreement = byJob.get(row.jobId);
      const serviceDate = jobs.find((job) => job.jobId === row.jobId)?.serviceDate ?? '';
      return {
        cleaner: cleaner.name || 'Cleaner',
        job: agreement?.Job.jobReference || row.jobId,
        date: formatDay(serviceDate),
        method:
          row.payBasis === 'HISTORICAL_AS_PAID'
            ? 'Historical as paid'
            : agreement
              ? compensationMethodLabel(agreement.method)
              : row.method,
        rate: agreement ? cleanerPayLabel(agreement.method, Number(agreement.rate)) : String(row.rate),
        hours:
          row.verifiedHours == null
            ? row.status === 'NEEDS_HOURS'
              ? 'Not verified'
              : '—'
            : String(row.verifiedHours),
        expected: formatMoney(row.expected),
        paid: row.status === 'NEEDS_HOURS' ? '—' : formatMoney(row.paid),
        balance: formatMoney(row.balance),
        status: STATUS_LABEL[row.status] ?? row.status,
      };
    });

    const today = new Date().toISOString().slice(0, 10);
    const currentTerms = termsInEffect(terms.map((row) => cleanerTermsFromRow(row)), today);
    const year = new Date().getUTCFullYear();
    const ytd = yearToDateTotal(paymentInputs, cleaner.id, year);
    const notice = thresholdNotice(ytd, settings ? Number(settings.threshold1099) : DEFAULT_1099_THRESHOLD);
    const advances = payments.flatMap((payment) =>
      payment.allocations
        .filter((allocation) => allocation.allocationType === 'ADVANCE')
        .map((allocation) => ({
          date: formatDay(day(payment.paidOn)),
          amount: formatMoney(money(allocation.amount)),
          memo: allocation.memo || '—',
          applied: allocation.appliedJobId ? 'Applied to a later job' : 'Not applied to a job',
        }))
    );

    return NextResponse.json({
      success: true,
      cleanerId: cleaner.id,
      cleanerName: cleaner.name || 'Cleaner',
      terms: currentTerms
        ? {
            soloMethod: currentTerms.soloMethod,
            soloRate: currentTerms.soloRate,
            assistedMethod: currentTerms.assistedMethod,
            assistedRate: currentTerms.assistedRate,
            effectiveFrom: currentTerms.effectiveFrom,
            homeSizeException: currentTerms.homeSizeException
              ? {
                  minBedrooms: currentTerms.homeSizeException.minBedrooms,
                  method: currentTerms.homeSizeException.method,
                  rate: currentTerms.homeSizeException.rate,
                  label: homeSizeExceptionLabel(currentTerms.homeSizeException),
                }
              : null,
          }
        : null,
      w9Status: profile?.w9Status ?? 'MISSING',
      w9StatusOn: profile?.w9StatusOn?.toISOString().slice(0, 10) ?? null,
      ytd: {
        total: formatMoney(notice.ytd),
        threshold: formatMoney(notice.threshold),
        warnAt: formatMoney(notice.warnAt),
        warning: notice.warning,
      },
      advances,
      reimbursements: reimbursements.map((row) => ({
        person: row.personName,
        amount: formatMoney(money(row.amount)),
        detail: `${formatDay(day(row.ManualPayment.paidOn))} · ${row.ManualPayment.memo || 'Personal funds'}`,
      })),
      unmatched: unmatched.map((row) => ({
        cleaner: row.ManualPayment.Cleaner.name || 'Cleaner',
        amount: formatMoney(money(row.amount)),
        reference: row.jobReference || 'Unmatched',
        basis: row.payBasisNote || '—',
      })),
      lines,
      payments: payments.map((payment) => ({
        date: formatDay(day(payment.paidOn)),
        amount: formatMoney(money(payment.amount)),
        method: payment.method === 'ZELLE' ? 'Zelle' : payment.method === 'CASH' ? 'Cash' : payment.method === 'CHECK' ? 'Check' : 'Other',
        memo: payment.memo || '—',
        allocated:
          payment.allocations.length === 0
            ? 'Not allocated'
            : `Allocated ${formatMoney(payment.allocations.reduce((sum, row) => sum + (money(row.amount) ?? 0), 0))}`,
      })),
    });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not load cleaner pay';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
