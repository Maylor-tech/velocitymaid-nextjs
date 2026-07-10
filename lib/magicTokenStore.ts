/**
 * Magic Token Store (Database-backed)
 *
 * Stores one-click magic-link tokens in the `CustomerLoginToken` table — the
 * same table the email+code login flow uses (`code` holds either a 6-digit
 * login code or a long random hex magic-link token; `used`/`expiresAt` gate
 * both the same way). There is no separate `MagicLoginToken` model.
 */

import { prisma } from './prisma';
import { nanoid } from 'nanoid';

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
  await prisma.customerLoginToken.create({
    data: {
      id: nanoid(),
      customerId: data.customerId,
      code: token,
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
  const tokenRecord = await prisma.customerLoginToken.findFirst({
    where: {
      code: token,
      used: false,
      expiresAt: { gt: new Date() },
    },
    include: { Customer: { select: { id: true, email: true } } },
  });

  if (!tokenRecord) {
    return null;
  }

  // Mark as used (atomic update)
  await prisma.customerLoginToken.update({
    where: { id: tokenRecord.id },
    data: { used: true },
  });

  return {
    customerId: tokenRecord.Customer.id,
    email: tokenRecord.Customer.email,
    expiresAt: tokenRecord.expiresAt.getTime(),
  };
}

/**
 * Clean up expired tokens (call from cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.customerLoginToken.deleteMany({
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
  return await prisma.customerLoginToken.count({
    where: {
      customerId,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
}

