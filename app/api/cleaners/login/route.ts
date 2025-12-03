import { NextRequest, NextResponse } from 'next/server';
import { findCleanerByIdentifier } from '@/utils/cleanerData';
import { cookies } from 'next/headers';

/**
 * Cleaner Login API
 * 
 * POST /api/cleaners/login
 * 
 * Body: { identifier: string } // phone or email
 * 
 * Returns: { success: true, cleaner: { id, name, phone, region } }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Identifier (phone or email) is required' },
        { status: 400 }
      );
    }

    // Find cleaner by phone or email
    const cleaner = findCleanerByIdentifier(identifier);

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 401 }
      );
    }

    if (!cleaner.active) {
      return NextResponse.json(
        { success: false, error: 'Cleaner account is inactive' },
        { status: 403 }
      );
    }

    // Set HTTP-only cookie with cleaner ID
    const cookieStore = await cookies();
    cookieStore.set('cleanerId', cleaner.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Return cleaner info (without sensitive data)
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
    console.error('Cleaner login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

/**
 * Logout - Clear cookie
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('cleanerId');
    
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}



