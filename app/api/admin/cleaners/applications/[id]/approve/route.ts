export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTrainingWelcomeNotification } from '@/app/services/trainingNotifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add admin authentication check
  try {
    const { id } = params;

    const application = await prisma.cleanerApplication.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Application has already been processed' },
        { status: 400 }
      );
    }

    // Create user account
    const user = await prisma.user.create({
      data: {
        email: application.email,
        name: application.name,
        role: 'CLEANER',
        primaryBranchId: application.branchId,
      },
    });

    // Create UserBranch relationship
    await prisma.userBranch.create({
      data: {
        userId: user.id,
        branchId: application.branchId,
      },
    });

    // Create default CleanerAvailability template
    // Use daysAvailable from application if available, otherwise default to weekdays
    const defaultWorkingDays = application.daysAvailable
      ? (application.daysAvailable as string[])
      : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    await prisma.cleanerAvailability.create({
      data: {
        cleanerId: user.id,
        workingDays: defaultWorkingDays,
        timeRanges: [{ start: '09:00', end: '17:00' }],
        maxDailyJobs: 3,
        blackoutDates: [],
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Create training status for ALL branches (Phase 3 requirement)
    await prisma.trainingStatus.create({
      data: {
        cleanerId: user.id,
        overallStatus: 'PENDING', // Phase 3: Start with PENDING status
        updatedAt: new Date(),
      },
    });

    // Update application status
    await prisma.cleanerApplication.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    // Send WhatsApp welcome message with training link for Jamaica branch (non-blocking)
    if (
      application.branch.country === 'Jamaica' ||
      application.branch.country === 'JM' ||
      application.branch.slug === 'port-antonio'
    ) {
      try {
        const whatsappPhone = application.whatsappNumber || application.phone;
        await sendTrainingWelcomeNotification(user.id, whatsappPhone);
      } catch (whatsappError) {
        console.error('Failed to send training welcome notification:', whatsappError);
        // Don't fail the approval if WhatsApp fails
      }
    }

    // TODO: Send welcome email with login credentials
    // TODO: Generate temporary password or send invite link

    return NextResponse.json({
      success: true,
      user,
      message: 'Application approved and user account created',
    });
  } catch (error: any) {
    console.error('Approve cleaner application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve application' },
      { status: 500 }
    );
  }
}



