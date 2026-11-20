import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import {
  cleanerTermsFromRow,
  COMPENSATION_METHODS,
  homeSizeColumns,
  homeSizeExceptionLabel,
  paperworkFromProfile,
  parseHomeSizeException,
  TAX_PAPERWORK_TYPES,
  termsInEffect,
  type CompensationMethod,
  type TaxPaperworkType,
} from '@/lib/cleanerComp/pay';

export const dynamic = 'force-dynamic';

function methodOr(value: unknown, fallback: CompensationMethod): CompensationMethod {
  return COMPENSATION_METHODS.includes(value as CompensationMethod)
    ? (value as CompensationMethod)
    : fallback;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const cleanerId = request.nextUrl.searchParams.get('cleanerId') || '';
    const jobId = request.nextUrl.searchParams.get('jobId') || '';
    if (!cleanerId) {
      return NextResponse.json({ success: false, error: 'Choose a cleaner.' }, { status: 400 });
    }
    const [rows, profile, job] = await Promise.all([
      prisma.cleanerCompTerms.findMany({ where: { cleanerId }, orderBy: { effectiveFrom: 'asc' } }),
      prisma.cleanerProfile.findUnique({
        where: { userId: cleanerId },
        select: { taxPaperworkType: true, taxPaperworkStatus: true, taxPaperworkOn: true },
      }),
      jobId
        ? prisma.job.findUnique({
            where: { id: jobId },
            select: { preferredDate: true, completedAt: true, Property: { select: { bedrooms: true } } },
          })
        : Promise.resolve(null),
    ]);
    const serviceDay = (job?.completedAt ?? job?.preferredDate)?.toISOString().slice(0, 10)
      || new Date().toISOString().slice(0, 10);
    const terms = termsInEffect(rows.map((row) => cleanerTermsFromRow(row)), serviceDay);
    return NextResponse.json({
      success: true,
      serviceDate: serviceDay,
      bedrooms: job?.Property?.bedrooms ?? null,
      terms: terms
        ? {
            soloMethod: terms.soloMethod,
            soloRate: terms.soloRate,
            assistedMethod: terms.assistedMethod,
            assistedRate: terms.assistedRate,
            effectiveFrom: terms.effectiveFrom,
            homeSizeException: terms.homeSizeException
              ? {
                  ...terms.homeSizeException,
                  label: homeSizeExceptionLabel(terms.homeSizeException),
                }
              : null,
          }
        : null,
      paperwork: paperworkFromProfile(profile),
    });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not load terms';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const cleanerId = String(body.cleanerId || '');
    if (!cleanerId) {
      return NextResponse.json({ success: false, error: 'Choose a cleaner.' }, { status: 400 });
    }
    const soloRate = Number(body.soloRate);
    const assistedRate = Number(body.assistedRate);
    const effectiveFrom = new Date(`${String(body.effectiveFrom || '')}T00:00:00.000Z`);
    const soloMethod = methodOr(body.soloMethod, 'PERCENTAGE');
    const assistedMethod = methodOr(body.assistedMethod, 'HOURLY');
    let exceptionColumns: ReturnType<typeof homeSizeColumns> | undefined;
    if ('homeSizeException' in body) {
      try {
        exceptionColumns = homeSizeColumns(parseHomeSizeException(body.homeSizeException));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Home-size exception is incomplete.';
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
    }
    const ratesMissing = !Number.isFinite(soloRate) || soloRate <= 0 || !Number.isFinite(assistedRate) || assistedRate <= 0;
    if (ratesMissing && exceptionColumns && (body.soloRate == null || body.soloRate === '')) {
      const rows = await prisma.cleanerCompTerms.findMany({
        where: { cleanerId },
        orderBy: { effectiveFrom: 'asc' },
      });
      const day = Number.isNaN(effectiveFrom.getTime())
        ? new Date().toISOString().slice(0, 10)
        : effectiveFrom.toISOString().slice(0, 10);
      const current = termsInEffect(
        rows.map((row) => ({ ...cleanerTermsFromRow(row), id: row.id })),
        day
      );
      if (!current?.id) {
        return NextResponse.json(
          { success: false, error: 'Set solo and assisted terms before adding a home-size exception.' },
          { status: 400 }
        );
      }
      const terms = await prisma.cleanerCompTerms.update({
        where: { id: current.id },
        data: { ...exceptionColumns, setBy: admin.userId, setAt: new Date() },
      });
      return NextResponse.json({
        success: true,
        effectiveFrom: terms.effectiveFrom.toISOString().slice(0, 10),
        homeSizeException: terms.homeSizeMinBedrooms == null
          ? null
          : homeSizeExceptionLabel({
              minBedrooms: terms.homeSizeMinBedrooms,
              method: terms.homeSizeSoloMethod || 'FLAT',
              rate: Number(terms.homeSizeSoloRate),
            }),
      });
    }
    if (!cleanerId || ratesMissing) {
      return NextResponse.json({ success: false, error: 'Cleaner, solo rate, and assisted rate are required.' }, { status: 400 });
    }
    if (Number.isNaN(effectiveFrom.getTime())) {
      return NextResponse.json({ success: false, error: 'Terms need an effective date.' }, { status: 400 });
    }
    const terms = await prisma.cleanerCompTerms.upsert({
      where: { cleanerId_effectiveFrom: { cleanerId, effectiveFrom } },
      update: {
        soloMethod,
        soloRate,
        assistedMethod,
        assistedRate,
        setBy: admin.userId,
        setAt: new Date(),
        ...(exceptionColumns ?? {}),
      },
      create: {
        cleanerId,
        soloMethod,
        soloRate,
        assistedMethod,
        assistedRate,
        effectiveFrom,
        setBy: admin.userId,
        ...(exceptionColumns ?? homeSizeColumns(null)),
      },
    });

    const paperwork = paperworkFromProfile(null);
    if (body.paperwork != null) {
      const type = body.paperwork.type as TaxPaperworkType;
      const on = new Date(`${String(body.paperwork.on || '')}T00:00:00.000Z`);
      if (!TAX_PAPERWORK_TYPES.includes(type) || type === 'NONE' || Number.isNaN(on.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Tax paperwork needs a W-9 or W-4 and I-9, and a date.' },
          { status: 400 }
        );
      }
      await prisma.cleanerProfile.upsert({
        where: { userId: cleanerId },
        update: { taxPaperworkType: type, taxPaperworkStatus: 'ON_FILE', taxPaperworkOn: on },
        create: { userId: cleanerId, taxPaperworkType: type, taxPaperworkStatus: 'ON_FILE', taxPaperworkOn: on },
      });
      paperwork.type = type;
      paperwork.status = 'ON_FILE';
      paperwork.on = on.toISOString().slice(0, 10);
    }

    return NextResponse.json({
      success: true,
      effectiveFrom: terms.effectiveFrom.toISOString().slice(0, 10),
      paperwork,
    });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not save terms';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
