import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sendVermontWorkApplicationEmail,
  sendVermontWorkApplicationReceipt,
} from '@/lib/email/sendVermontWorkApplication';
import {
  validateVermontWorkApplication,
  vermontWorkApplicationFromBody,
  WORK_AREA_LABELS,
} from '@/lib/marketing/vermontWorkWithUs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const error = validateVermontWorkApplication(body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }
    const application = vermontWorkApplicationFromBody(body);
    const branch = await prisma.branch.findUnique({
      where: { slug: 'vermont' },
      select: { id: true, status: true },
    });
    if (!branch || (branch.status !== 'ACTIVE' && branch.status !== 'COMING_SOON')) {
      return NextResponse.json(
        { success: false, error: 'Vermont applications are not open right now.' },
        { status: 503 }
      );
    }

    const record = await prisma.cleanerApplication.create({
      data: {
        id: randomUUID(),
        name: application.name,
        email: application.email,
        phone: application.phone,
        branchId: branch.id,
        experienceLevel: application.yearsExperience,
        daysAvailable: application.daysAvailable,
        weekendAbility: application.daysAvailable.some((day) => day === 'Saturday' || day === 'Sunday'),
        areaOfResidence: `${application.town} · ${WORK_AREA_LABELS[application.area]}`,
        notes: null,
        applicationData: application,
        status: 'NEW',
        updatedAt: new Date(),
      },
    });

    const emails = await Promise.allSettled([
      sendVermontWorkApplicationEmail({ application, applicationId: record.id }),
      sendVermontWorkApplicationReceipt({ toEmail: application.email, name: application.name }),
    ]);
    for (const result of emails) {
      if (result.status === 'rejected') {
        console.error('[vermont-work-with-us] email failed', result.reason);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[vermont-work-with-us] submit failed', error);
    return NextResponse.json(
      { success: false, error: 'We could not save your application. Try again, or email hello@velocitymaid.com.' },
      { status: 500 }
    );
  }
}
