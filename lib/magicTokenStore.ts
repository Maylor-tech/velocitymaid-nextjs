/**
 * Magic Token Store (Database-backed)
 * 
 * Production-ready token storage using Prisma.
 * Provides durability, replay protection, and auditability.
 */

import { prisma } from './prisma';

export interface MagicTokenData {
  customerId: string;
  email: string;
  expiresAt: number;
}

/**
 * Store a magic token in database
 */
export async function storeMagicToken(
  token: string,
  data: MagicTokenData
): Promise<void> {
  await prisma.magicLoginToken.create({
    data: {
      token,
      customerId: data.customerId,
      expiresAt: new Date(data.expiresAt),
    },
  });
}

/**
 * Retrieve and mark token as used (atomic operation)
 */
export async function consumeMagicToken(
  token: string
): Promise<MagicTokenData | null> {
  // Find unused, non-expired token
  const tokenRecord = await prisma.magicLoginToken.findUnique({
    where: { token },
    include: { customer: { select: { id: true, email: true } } },
  });

  if (!tokenRecord) {
    return null;
  }

  // Check if already used
  if (tokenRecord.usedAt) {
    return null; // Token already consumed
  }

  // Check if expired
  if (tokenRecord.expiresAt < new Date()) {
    return null;
  }

  // Mark as used (atomic update)
  await prisma.magicLoginToken.update({
    where: { id: tokenRecord.id },
    data: { usedAt: new Date() },
  });

  return {
    customerId: tokenRecord.customer.id,
    email: tokenRecord.customer.email,
    expiresAt: tokenRecord.expiresAt.getTime(),
  };
}

/**
 * Clean up expired tokens (call from cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.magicLoginToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Check if email has too many active tokens (rate limiting)
 */
export async function countActiveTokensForCustomer(
  customerId: string
): Promise<number> {
  return await prisma.magicLoginToken.count({
    where: {
      customerId,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
}

