export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { sendTrainingWelcomeNotification } from '@/app/services/trainingNotifications';
import { isOpenCleanerApplication } from '@/lib/cleaners/applicationStatus';
import { createInternalCleaner } from '@/lib/cleaners/internalCleanerService';
import { parseTalentApplicationData } from '@/components/admin/cleaners/TalentApplicationView';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const { id } = params;

    const application = await prisma.cleanerApplication.findUnique({
      where: { id },
      include: { Branch: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (!isOpenCleanerApplication(application.status)) {
      return NextResponse.json(
        { success: false, error: 'Application has already been processed' },
        { status: 400 }
      );
    }

    const talent = parseTalentApplicationData(application.applicationData);
    const nameParts = application.name.trim().split(/\s+/);
    const firstName = talent?.personal.firstName || nameParts[0] || application.name;
    const lastName = talent?.personal.lastName || nameParts.slice(1).join(' ') || '';

    const { userId } = await createInternalCleaner({
      firstName,
      lastName,
      email: application.email,
      phone: application.phone,
      publicDisplayName: application.preferredName || talent?.personal.preferredName || null,
      jobTitle: 'Certified Cleaning Professional',
      branchId: application.branchId,
      serviceAreas: talent?.serviceAreas.areas,
      memberStatus: 'TRAINING',
      certificationLabel: 'In certification',
      internalNotes: application.notes,
      isInternalTeam: false,
      trainingPassed: false,
    });

    const now = new Date();
    const defaultWorkingDays = application.daysAvailable
      ? (application.daysAvailable as string[])
      : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    await prisma.cleanerAvailability.upsert({
      where: { cleanerId: userId },
      create: {
        id: randomUUID(),
        cleanerId: userId,
        workingDays: defaultWorkingDays,
        timeRanges: [{ start: '09:00', end: '17:00' }],
        maxDailyJobs: 3,
        blackoutDates: [],
        isActive: true,
        updatedAt: now,
      },
      update: { workingDays: defaultWorkingDays, updatedAt: now },
    });

    await prisma.cleanerApplication.update({
      where: { id },
      data: { status: 'ACCEPTED', updatedAt: now },
    });

    const branch = application.Branch;
    if (
      branch &&
      (branch.country === 'Jamaica' ||
        branch.country === 'JM' ||
        branch.slug === 'port-antonio')
    ) {
      try {
        const whatsappPhone = application.whatsappNumber || application.phone;
        await sendTrainingWelcomeNotification(userId, whatsappPhone);
      } catch (whatsappError) {
        console.error('Failed to send training welcome notification:', whatsappError);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Application accepted and cleaner profile created',
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Approve cleaner application error:', error);
    const message = error instanceof Error ? error.message : 'Failed to approve application';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
