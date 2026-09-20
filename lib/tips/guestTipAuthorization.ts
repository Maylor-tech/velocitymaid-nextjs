/**
 * Phase 1C — GuestTipAuthorization mint / verify (hash-at-rest).
 * Raw token is returned once to the guest; only SHA-256 is stored.
 */

import { createHash, randomBytes } from 'crypto';
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { appBaseUrl } from '@/lib/feedback/serviceFeedback';

export const GUEST_TIP_GRANT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const TOKEN_BYTES = 32;

export class GuestTipGrantError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'GuestTipGrantError';
    this.code = code;
  }
}

export function hashGuestTipGrantToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim(), 'utf8').digest('hex');
}

export function tipPublicUrlForGrant(rawToken: string): string {
  return `${appBaseUrl()}/tip?grant=${encodeURIComponent(rawToken)}`;
}

export type MintedGuestTipGrant = {
  grantToken: string;
  tipUrl: string;
  expiresAt: Date;
  grantId: string;
};

export async function mintGuestTipAuthorization(input: {
  jobId: string;
  propertyId: string;
  ttlMs?: number;
}): Promise<MintedGuestTipGrant> {
  const raw = randomBytes(TOKEN_BYTES).toString('base64url');
  const tokenHash = hashGuestTipGrantToken(raw);
  const expiresAt = new Date(
    Date.now() + (input.ttlMs ?? GUEST_TIP_GRANT_TTL_MS)
  );

  const row = await prisma.guestTipAuthorization.create({
    data: {
      tokenHash,
      jobId: input.jobId,
      propertyId: input.propertyId,
      expiresAt,
    },
  });

  return {
    grantToken: raw,
    tipUrl: tipPublicUrlForGrant(raw),
    expiresAt,
    grantId: row.id,
  };
}

export type VerifiedGuestTipGrant = {
  grantId: string;
  jobId: string;
  propertyId: string;
};

/**
 * Validate raw grant for tip context/create. Does not consume (multi-tip allowed).
 */
export async function verifyGuestTipGrant(
  rawToken: string
): Promise<VerifiedGuestTipGrant> {
  const trimmed = rawToken?.trim();
  if (!trimmed || trimmed.length < 16) {
    throw new GuestTipGrantError(
      'INVALID_GRANT',
      'This tip link is invalid or expired.'
    );
  }

  const tokenHash = hashGuestTipGrantToken(trimmed);
  const row = await prisma.guestTipAuthorization.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      jobId: true,
      propertyId: true,
      expiresAt: true,
      revokedAt: true,
      Property: {
        select: { guestAccessRevokedAt: true },
      },
      Job: {
        select: {
          id: true,
          status: true,
          archivedAt: true,
          propertyId: true,
        },
      },
    },
  });

  if (!row || row.revokedAt) {
    throw new GuestTipGrantError(
      'INVALID_GRANT',
      'This tip link is invalid or expired.'
    );
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    throw new GuestTipGrantError(
      'GRANT_EXPIRED',
      'This tip link has expired. Scan the property card again and re-enter your checkout date.'
    );
  }

  if (row.Property.guestAccessRevokedAt != null) {
    throw new GuestTipGrantError(
      'INVALID_GRANT',
      'This tip link is invalid or expired.'
    );
  }

  if (
    !row.Job ||
    row.Job.status !== JobStatus.COMPLETED ||
    row.Job.archivedAt != null
  ) {
    throw new GuestTipGrantError(
      'JOB_NOT_ELIGIBLE',
      'This stay is not eligible for tipping.'
    );
  }

  if (row.Job.propertyId && row.Job.propertyId !== row.propertyId) {
    throw new GuestTipGrantError(
      'INVALID_GRANT',
      'This tip link is invalid or expired.'
    );
  }

  return {
    grantId: row.id,
    jobId: row.jobId,
    propertyId: row.propertyId,
  };
}

/** Audit touch after a successful tip intent create (does not invalidate grant). */
export async function recordGuestTipGrantUse(grantId: string): Promise<void> {
  await prisma.guestTipAuthorization.update({
    where: { id: grantId },
    data: {
      lastUsedAt: new Date(),
      useCount: { increment: 1 },
    },
  });
}

export async function revokeGuestTipAuthorization(grantId: string): Promise<void> {
  await prisma.guestTipAuthorization.update({
    where: { id: grantId },
    data: { revokedAt: new Date() },
  });
}
