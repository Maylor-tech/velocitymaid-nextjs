export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateApplicantFitScore } from '@/utils/applicantScore';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import type { TalentApplicationPayload } from '@/lib/cleaners/talentApplicationTypes';
import { validateTalentApplication } from '@/lib/cleaners/validateTalentApplication';
import { resolveBranchIdFromServiceAreas } from '@/lib/cleaners/resolveApplicationBranch';
import {
  sendCleanerApplicationConfirmationEmail,
  sendCleanerApplicationInternalNotification,
} from '@/lib/email/sendCleanerApplicationEmails';

function isTalentPortal(body: Record<string, unknown>): body is { application: TalentApplicationPayload } {
  return (
    typeof body.application === 'object' &&
    body.application !== null &&
    (body.application as TalentApplicationPayload).portalVersion === 'talent-v1'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isTalentPortal(body)) {
      return handleTalentPortalSubmit(body.application);
    }

    return handleLegacySubmit(body);
  } catch (error: unknown) {
    console.error('Cleaner application error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit application';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function handleTalentPortalSubmit(payload: TalentApplicationPayload) {
  const validationError = validateTalentApplication(payload);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  const branches = await prisma.branch.findMany({
    where: { status: { in: ['ACTIVE', 'COMING_SOON'] } },
    select: { id: true, slug: true, country: true, name: true },
  });

  const branchId = resolveBranchIdFromServiceAreas(payload.serviceAreas.areas, branches);
  if (!branchId) {
    return NextResponse.json(
      { success: false, error: 'Unable to match your service area to an active branch. Please contact us.' },
      { status: 400 }
    );
  }

  const branch = branches.find((b) => b.id === branchId)!;
  const { personal } = payload;
  const fullName = `${personal.firstName.trim()} ${personal.lastName.trim()}`.trim();
  const areaOfResidence = `${personal.city.trim()}, ${personal.state.trim()} ${personal.zipCode.trim()}`.trim();

  const record = await prisma.cleanerApplication.create({
    data: {
      id: randomUUID(),
      name: fullName,
      preferredName: personal.preferredName.trim() || null,
      email: personal.email.trim().toLowerCase(),
      phone: personal.phone.trim(),
      whatsappNumber: personal.phone.trim(),
      branchId,
      experienceLevel: payload.experience.yearsExperience,
      areaOfResidence,
      daysAvailable: payload.availability.daysAvailable,
      weekendAbility: payload.availability.weekendTurnovers,
      canTravelToVillas: payload.serviceAreas.areas.some((a) =>
        ['Ludlow', 'Okemo', 'Killington', 'Woodstock'].includes(a)
      ),
      notes: buildTalentNotesSummary(payload),
      applicationData: payload as object,
      status: 'NEW',
      updatedAt: new Date(),
    },
  });

  const emailResults = await Promise.allSettled([
    sendCleanerApplicationConfirmationEmail({
      toEmail: record.email,
      applicantName: personal.preferredName.trim() || personal.firstName.trim(),
    }),
    sendCleanerApplicationInternalNotification({
      applicantName: record.name,
      applicantEmail: record.email,
      branchName: branch.name,
      applicationId: record.id,
      serviceAreas: payload.serviceAreas.areas,
    }),
  ]);

  for (const result of emailResults) {
    if (result.status === 'rejected') {
      console.error('[TALENT_APPLY] Email notification failed:', result.reason);
    } else if (!result.value.sent) {
      console.warn('[TALENT_APPLY] Email skipped:', result.value.skippedReason);
    }
  }

  return NextResponse.json({
    success: true,
    applicationId: record.id,
    message: 'Application submitted successfully',
  });
}

function buildTalentNotesSummary(app: TalentApplicationPayload): string {
  const lines = [
    `Talent portal v1`,
    `Address: ${app.personal.streetAddress}, ${app.personal.city}, ${app.personal.state} ${app.personal.zipCode}`,
    `Service areas: ${app.serviceAreas.areas.join(', ')}`,
    `Max travel: ${app.serviceAreas.maxTravelDistance}`,
    `Preferred time: ${app.availability.preferredTime}`,
    `Max hours/week: ${app.availability.maxHoursPerWeek}`,
  ];
  return lines.join('\n');
}

async function handleLegacySubmit(body: Record<string, unknown>) {
  const {
    name,
    email,
    phone,
    whatsappNumber,
    country,
    branchId,
    experienceLevel,
    areaOfResidence,
    daysAvailable,
    weekendAbility,
    canTravelToVillas,
    idUploadUrl,
    referencesUploadUrl,
    notes,
  } = body as Record<string, unknown>;

  if (!name || !email || !phone) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: name, email, and phone are required' },
      { status: 400 }
    );
  }

  if (!country || typeof country !== 'string' || country.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'Country selection is required. Please select a country.' },
      { status: 400 }
    );
  }

  if (!branchId || typeof branchId !== 'string' || branchId.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'Branch selection is required. Please select a branch.' },
      { status: 400 }
    );
  }

  const branch = await prisma.branch.findUnique({
    where: { id: (branchId as string).trim() },
    select: { id: true, status: true, slug: true, country: true },
  });

  if (!branch) {
    return NextResponse.json(
      { success: false, error: 'Invalid branch selected. Please select a valid branch.' },
      { status: 400 }
    );
  }

  const branchCountry = branch.country || '';
  const countryMatch =
    (country === 'Jamaica' && (branchCountry === 'Jamaica' || branchCountry === 'JM')) ||
    (country === 'USA' &&
      (branchCountry === 'USA' || branchCountry === 'US' || branchCountry === 'United States'));

  if (!countryMatch) {
    return NextResponse.json(
      { success: false, error: 'Selected branch does not match selected country. Please verify your selections.' },
      { status: 400 }
    );
  }

  if (branch.status !== 'ACTIVE' && branch.status !== 'COMING_SOON') {
    return NextResponse.json(
      { success: false, error: 'Branch is not accepting applications' },
      { status: 400 }
    );
  }

  let applicantFitScore: number | null = null;
  const isJamaicaBranch =
    branch.country === 'Jamaica' ||
    branch.country === 'JM' ||
    branch.slug === 'port-antonio';

  if (isJamaicaBranch) {
    applicantFitScore = await calculateApplicantFitScore({
      daysAvailable: (daysAvailable as string[] | null) || null,
      weekendAbility: Boolean(weekendAbility),
      canTravelToVillas: Boolean(canTravelToVillas),
      areaOfResidence: (areaOfResidence as string | null) || null,
      experienceLevel: (experienceLevel as string | null) || null,
      phone: (whatsappNumber as string) || (phone as string),
      branchId: (branchId as string).trim(),
    });
  }

  const application = await prisma.cleanerApplication.create({
    data: {
      id: randomUUID(),
      name: name as string,
      email: email as string,
      phone: phone as string,
      whatsappNumber: (whatsappNumber as string) || null,
      branchId: (branchId as string).trim(),
      experienceLevel: (experienceLevel as string) || null,
      areaOfResidence: (areaOfResidence as string) || null,
      daysAvailable: daysAvailable ? JSON.parse(JSON.stringify(daysAvailable)) : null,
      weekendAbility: Boolean(weekendAbility),
      canTravelToVillas: Boolean(canTravelToVillas),
      idUploadUrl: (idUploadUrl as string) || null,
      referencesUploadUrl: (referencesUploadUrl as string) || null,
      applicantFitScore,
      notes: (notes as string) || null,
      status: 'NEW',
      updatedAt: new Date(),
    },
  });

  if (isJamaicaBranch && (whatsappNumber || phone)) {
    const whatsappPhone = (whatsappNumber as string) || (phone as string);
    try {
      if (applicantFitScore !== null) {
        if (applicantFitScore >= 70) {
          const interviewMessage = `🎉 Great news! Your application looks strong!\n\nWe'd like to schedule an interview with you.\n\nBook your interview time here:\nhttps://velocitymaid.com/jamaica/interview\n\nWe'll be in touch soon!`;
          await sendWhatsAppMessage(whatsappPhone, interviewMessage);
        } else if (applicantFitScore < 40) {
          const rejectionMessage = `Thank you for your interest in joining VelocityMaid.\n\nAfter reviewing your application, we don't have a position that matches your profile at this time. We'll keep your application on file for future opportunities.\n\nThank you for considering VelocityMaid!`;
          await sendWhatsAppMessage(whatsappPhone, rejectionMessage);
        } else {
          const standardMessage = `Thank you for applying to VelocityMaid!\n\nWe've received your application and will review it carefully. We'll be in touch within 2-3 business days.\n\nThank you for your interest!`;
          await sendWhatsAppMessage(whatsappPhone, standardMessage);
        }
      }
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp message:', whatsappError);
    }
  }

  return NextResponse.json({
    success: true,
    application,
    applicantFitScore,
    message: 'Application submitted successfully',
  });
}
