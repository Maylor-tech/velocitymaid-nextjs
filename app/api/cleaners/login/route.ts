/**
 * Cleaner Login API (Simplified - No DB Lookup)
 * 
 * POST /api/cleaners/login
 * 
 * Body: { identifier: string } // phone or email
 * 
 * Returns: { ok: true }
 * 
 * Creates deterministic cleanerId from identifier hash
 * Sets cookie for authentication
 * No database lookup during login (fast, safe for demo/launch)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    let body: { identifier?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body. Send { "identifier": "email or phone" }.' },
        { status: 400 }
      );
    }

    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Identifier required (email or phone)' },
        { status: 400 }
      );
    }

    const normalized = identifier.trim().toLowerCase();
    let cleanerId = crypto
      .createHash('sha256')
      .update(normalized)
      .digest('hex')
      .substring(0, 32);

    // Email login must resolve to the real User.id so assignedCleanerId matches the session cookie.
    if (normalized.includes('@')) {
      const cleaner = await prisma.user.findFirst({
        where: {
          email: normalized,
          role: UserRole.CLEANER,
          isActive: true,
        },
        select: { id: true },
      });
      if (cleaner) {
        cleanerId = cleaner.id;
      } else {
        return NextResponse.json(
          { error: 'No active cleaner account found for that email' },
          { status: 404 }
        );
      }
    }

    // Set HTTP-only cookie with cleaner ID
    const cookieStore = await cookies();
    cookieStore.set('cleanerId', cleanerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[CLEANER_LOGIN] Error:', err);
    const message =
      err instanceof Error && err.message.includes('connect')
        ? 'Database unavailable. Check DATABASE_URL and try again.'
        : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
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

