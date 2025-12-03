import { NextRequest, NextResponse } from 'next/server';

/**
 * Complete Onboarding API
 * 
 * POST /api/cleaners/onboarding/complete
 * 
 * Completes cleaner onboarding process
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add cleaner authentication check
    
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      ssn,
      bankName,
      accountHolderName,
      accountNumber,
      routingNumber,
      accountType,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !dateOfBirth) {
      return NextResponse.json(
        { success: false, error: 'Missing required personal information' },
        { status: 400 }
      );
    }

    if (!bankName || !accountHolderName || !accountNumber || !routingNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required banking information' },
        { status: 400 }
      );
    }

    // TODO: Store in database
    // await updateCleanerProfile(cleanerId, {
    //   firstName,
    //   lastName,
    //   email,
    //   phone,
    //   dateOfBirth,
    //   ssnLast4: ssn,
    //   bankDetails: {
    //     bankName,
    //     accountHolderName,
    //     accountNumber: encrypt(accountNumber), // Encrypt sensitive data
    //     routingNumber: encrypt(routingNumber),
    //     accountType,
    //   },
    //   onboardingCompleted: true,
    //   onboardingCompletedAt: new Date(),
    // });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error: any) {
    console.error('Complete onboarding error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}



