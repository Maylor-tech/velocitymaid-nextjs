export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Demo Data Seeding API
 * 
 * POST /api/dev/seed
 * 
 * Seeds the database with demo data for development and testing.
 * Only available in development mode.
 */
export async function POST(request: NextRequest) {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development' && process.env.APP_ENV !== 'development') {
    return NextResponse.json(
      {
        success: false,
        error: 'Seeding is only available in development mode',
      },
      { status: 403 }
    );
  }

  try {
    // Dynamically import the seed script
    const { seedDemoData } = await import('@/scripts/seed-demo-data');

    // Execute the seed
    const result = await seedDemoData();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed demo data',
      },
      { status: 500 }
    );
  }
}
