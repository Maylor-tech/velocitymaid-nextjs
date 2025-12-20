export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { findCleanerByIdentifier } from '@/utils/cleanerData';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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

    // Try database first (for seeded cleaners)
    const normalizedIdentifier = identifier.toLowerCase().trim();
    let cleaner = await prisma.user.findFirst({
      where: {
        role: UserRole.CLEANER,
        isActive: true,
        email: normalizedIdentifier, // Only check email for now
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // If not found in database, try mock data (for backward compatibility)
    if (!cleaner) {
      const mockCleaner = findCleanerByIdentifier(identifier);
      if (mockCleaner && mockCleaner.active) {
        // Set HTTP-only cookie with cleaner ID
        const cookieStore = await cookies();
        cookieStore.set('cleanerId', mockCleaner.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });

        return NextResponse.json({
          success: true,
          cleaner: {
            id: mockCleaner.id,
            name: mockCleaner.name,
            phone: mockCleaner.phone,
            region: mockCleaner.region,
          },
        });
      }
    }

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 401 }
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
        name: cleaner.name || 'Cleaner',
        email: cleaner.email,
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




