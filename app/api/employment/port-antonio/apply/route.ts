export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';

/**
 * Port Antonio Employment Application API
 * 
 * POST /api/employment/port-antonio/apply
 * 
 * Submits employment application for Port Antonio branch
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      availability,
      experience,
      whyJoin,
      consent,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !address || !availability || !consent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Store in database
    // await createEmploymentApplication({
    //   branchId: 'port-antonio-branch-id',
    //   firstName,
    //   lastName,
    //   email,
    //   phone,
    //   address,
    //   availability,
    //   experience: experience || null,
    //   whyJoin: whyJoin || null,
    //   status: 'pending',
    //   submittedAt: new Date(),
    // });

    // TODO: Send notification email to admin
    // await sendEmploymentApplicationNotification({
    //   applicantName: `${firstName} ${lastName}`,
    //   email,
    //   phone,
    //   branch: 'Port Antonio',
    // });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
    });
  } catch (error: any) {
    console.error('Employment application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}




