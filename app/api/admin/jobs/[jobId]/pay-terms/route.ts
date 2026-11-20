import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import {
  agreedCleaningPrice,
  appliedSoloTerms,
  cleanerPayLabel,
  cleanerTermsFromRow,
  paperworkFromProfile,
  resolveAssignmentAgreement,
  termsInEffect,
  type OfferChoice,
} from '@/lib/cleanerComp/pay';

export const dynamic = 'force-dynamic';

function serviceDay(job: { completedAt: Date | null; preferredDate: Date | null }): string {
  return (job.completedAt ?? job.preferredDate)?.toISOString().slice(0, 10) ?? '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        assignedCleanerId: true,
        preferredDate: true,
        completedAt: true,
        agreedOperationalPrice: true,
        agreedCustomerPrice: true,
        processingAllowanceEstimated: true,
        Property: { select: { bedrooms: true } },
        User: { select: { id: true, name: true } },
      },
    });
    if (!job) return NextResponse.json({ success: false, error: 'Job not found.' }, { status: 404 });
    if (!job.assignedCleanerId) {
      return NextResponse.json({
        success: true,
        assigned: false,
        agreement: null,
        terms: null,
      });
    }
    const [rows, profile, agreement] = await Promise.all([
      prisma.cleanerCompTerms.findMany({
        where: { cleanerId: job.assignedCleanerId },
        orderBy: { effectiveFrom: 'asc' },
      }),
      prisma.cleanerProfile.findUnique({
        where: { userId: job.assignedCleanerId },
        select: { taxPaperworkType: true, taxPaperworkStatus: true, taxPaperworkOn: true },
      }),
      prisma.compensationAgreement.findUnique({
        where: { jobId_cleanerId: { jobId: job.id, cleanerId: job.assignedCleanerId } },
      }),
    ]);
    const day = serviceDay(job);
    const terms = termsInEffect(rows.map((row) => cleanerTermsFromRow(row)), day);
    const solo = appliedSoloTerms(terms, job.Property?.bedrooms);
    return NextResponse.json({
      success: true,
      assigned: true,
      cleanerName: job.User?.name || 'Cleaner',
      serviceDate: day,
      bedrooms: job.Property?.bedrooms ?? null,
      paperwork: paperworkFromProfile(profile),
      terms: terms
        ? {
            soloMethod: solo?.method ?? terms.soloMethod,
            soloRate: solo?.rate ?? terms.soloRate,
            soloLabel: cleanerPayLabel(solo?.method ?? terms.soloMethod, solo?.rate ?? terms.soloRate),
            assistedMethod: terms.assistedMethod,
            assistedRate: terms.assistedRate,
            assistedLabel: cleanerPayLabel(terms.assistedMethod, terms.assistedRate),
            effectiveFrom: terms.effectiveFrom,
            homeSizeException: terms.homeSizeException,
          }
        : null,
      agreement: agreement
        ? {
            method: agreement.method,
            rate: Number(agreement.rate),
            assisted: agreement.assisted,
            label: cleanerPayLabel(agreement.method, Number(agreement.rate)),
            hasOffer: agreement.jobOfferId != null,
          }
        : null,
    });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not load pay terms';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const choice = String(body.choice || '') as OfferChoice;
    if (choice !== 'solo' && choice !== 'assisted') {
      return NextResponse.json({ success: false, error: 'Choose solo or assisted.' }, { status: 400 });
    }
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        assignedCleanerId: true,
        preferredDate: true,
        completedAt: true,
        agreedOperationalPrice: true,
        agreedCustomerPrice: true,
        processingAllowanceEstimated: true,
        Property: { select: { bedrooms: true } },
      },
    });
    if (!job) return NextResponse.json({ success: false, error: 'Job not found.' }, { status: 404 });
    if (!job.assignedCleanerId) {
      return NextResponse.json(
        { success: false, error: 'Assign a cleaner before saving pay terms. An offer is not required.' },
        { status: 400 }
      );
    }
    const existing = await prisma.compensationAgreement.findUnique({
      where: { jobId_cleanerId: { jobId: job.id, cleanerId: job.assignedCleanerId } },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadySaved: true,
        label: cleanerPayLabel(existing.method, Number(existing.rate)),
      });
    }
    const [rows, profile] = await Promise.all([
      prisma.cleanerCompTerms.findMany({ where: { cleanerId: job.assignedCleanerId } }),
      prisma.cleanerProfile.findUnique({
        where: { userId: job.assignedCleanerId },
        select: { taxPaperworkType: true, taxPaperworkStatus: true, taxPaperworkOn: true },
      }),
    ]);
    const day = serviceDay(job);
    const storedTerms = termsInEffect(rows.map((row) => cleanerTermsFromRow(row)), day);
    let draft: ReturnType<typeof resolveAssignmentAgreement>;
    try {
      draft = resolveAssignmentAgreement({
        choice,
        storedTerms,
        paperwork: paperworkFromProfile(profile),
        bedrooms: job.Property?.bedrooms ?? null,
        eligibleBase: agreedCleaningPrice({
          agreedOperationalPrice: job.agreedOperationalPrice,
          agreedCustomerPrice: job.agreedCustomerPrice,
          processingAllowance: job.processingAllowanceEstimated,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pay terms are required.';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    await prisma.compensationAgreement.create({
      data: {
        jobId: job.id,
        cleanerId: job.assignedCleanerId,
        jobOfferId: null,
        method: draft.method,
        rate: draft.rate,
        eligibleBase: draft.eligibleBase,
        manualEligibleBase: draft.manualEligibleBase,
        assisted: draft.assisted,
        includedAddOns: draft.includedAddOns,
        setBy: admin.userId,
        note: draft.note,
      },
    });
    return NextResponse.json({ success: true, label: cleanerPayLabel(draft.method, draft.rate) });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not save pay terms';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
