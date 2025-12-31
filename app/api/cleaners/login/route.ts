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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Identifier required' },
        { status: 400 }
      );
    }

    // Create a deterministic cleanerId from identifier
    // (safe for demo, stable across sessions, same identifier = same ID)
    const cleanerId = crypto
      .createHash('sha256')
      .update(identifier.trim().toLowerCase())
      .digest('hex')
      .substring(0, 32); // Use first 32 chars for cleaner ID format

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
  } catch (err: any) {
    console.error('[CLEANER_LOGIN] Error:', err);
    return NextResponse.json(
      { error: 'Login failed' },
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




