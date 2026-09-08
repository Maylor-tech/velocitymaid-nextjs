/**
 * Cleaner login. Session cookie cleanerId is always a real User.id.
 *
 * POST /api/cleaners/login  Body: { identifier: string } // email or phone
 * DELETE /api/cleaners/login  Logout
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import {
  isEmailIdentifier,
  normalizePhoneDigits,
  phonesMatch,
} from '@/lib/cleaners/phoneIdentity';

const NOT_FOUND_EMAIL = 'No active cleaner account found for that email';
const NOT_FOUND_PHONE = 'No active cleaner account found for that phone';

async function setCleanerSessionCookie(cleanerId: string) {
  const cookieStore = await cookies();
  cookieStore.set('cleanerId', cleanerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

async function resolveCleanerByEmail(email: string): Promise<string | null> {
  const cleaner = await prisma.user.findFirst({
    where: {
      email,
      role: UserRole.CLEANER,
      isActive: true,
    },
    select: { id: true },
  });
  return cleaner?.id ?? null;
}

async function resolveCleanerByPhone(input: string): Promise<string | null> {
  const inputDigits = normalizePhoneDigits(input);
  if (inputDigits.length < 10) return null;

  const candidates = await prisma.user.findMany({
    where: {
      role: UserRole.CLEANER,
      isActive: true,
      phone: { not: null },
    },
    select: { id: true, phone: true },
  });

  const matches = candidates.filter((row) => phonesMatch(row.phone, input));
  if (matches.length !== 1) return null;
  return matches[0].id;
}

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
    let cleanerId: string | null = null;

    if (isEmailIdentifier(normalized)) {
      cleanerId = await resolveCleanerByEmail(normalized);
      if (!cleanerId) {
        return NextResponse.json({ error: NOT_FOUND_EMAIL }, { status: 404 });
      }
    } else {
      cleanerId = await resolveCleanerByPhone(identifier.trim());
      if (!cleanerId) {
        return NextResponse.json({ error: NOT_FOUND_PHONE }, { status: 404 });
      }
    }

    await setCleanerSessionCookie(cleanerId);
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

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('cleanerId');
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
