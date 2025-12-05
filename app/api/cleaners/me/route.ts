export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCleanerById } from '@/utils/cleanerData';

/**
 * Get Current Cleaner Info
 * 
 * GET /api/cleaners/me
 * 
 * Returns: { success: true, cleaner: { id, name, phone, region } }
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const cleaner = findCleanerById(cleanerId);

    if (!cleaner || !cleaner.active) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found or inactive' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      cleaner: {
        id: cleaner.id,
        name: cleaner.name,
        phone: cleaner.phone,
        region: cleaner.region,
      },
    });
  } catch (error: any) {
    console.error('Get cleaner info error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get cleaner info' },
      { status: 500 }
    );
  }
}



