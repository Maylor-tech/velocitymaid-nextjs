/**
 * Phase 1B — property-scoped opaque guest stay access.
 * Token authorizes stay resolve only; never encodes property/customer/db identity.
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { appBaseUrl } from '@/lib/feedback/serviceFeedback';

const TOKEN_BYTES = 32;

export function generateGuestAccessToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function stayPublicUrl(token: string): string {
  return `${appBaseUrl()}/stay/${token}`;
}

export type ActiveGuestProperty = {
  id: string;
  guestDisplayName: string | null;
  guestAccessToken: string;
};

/**
 * Lookup by opaque token. Revoked or missing → null (opaque failure).
 */
export async function findActivePropertyByGuestToken(
  token: string
): Promise<ActiveGuestProperty | null> {
  const trimmed = token?.trim();
  if (!trimmed || trimmed.length < 16) return null;

  const property = await prisma.property.findFirst({
    where: {
      guestAccessToken: trimmed,
      guestAccessRevokedAt: null,
    },
    select: {
      id: true,
      guestDisplayName: true,
      guestAccessToken: true,
    },
  });

  if (!property?.guestAccessToken) return null;
  return {
    id: property.id,
    guestDisplayName: property.guestDisplayName,
    guestAccessToken: property.guestAccessToken,
  };
}

export function guestFacingDisplayName(
  guestDisplayName: string | null | undefined
): string {
  const trimmed = guestDisplayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'this property';
}

/** Ensure an active token exists for a host-owned property (idempotent). */
export async function ensurePropertyGuestAccessToken(propertyId: string): Promise<{
  token: string;
  stayUrl: string;
  created: boolean;
}> {
  const existing = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      guestAccessToken: true,
      guestAccessRevokedAt: true,
    },
  });
  if (!existing) throw new Error('Property not found');

  if (
    existing.guestAccessToken &&
    existing.guestAccessRevokedAt == null
  ) {
    return {
      token: existing.guestAccessToken,
      stayUrl: stayPublicUrl(existing.guestAccessToken),
      created: false,
    };
  }

  const token = generateGuestAccessToken();
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      guestAccessToken: token,
      guestAccessTokenCreatedAt: new Date(),
      guestAccessRevokedAt: null,
    },
  });
  return { token, stayUrl: stayPublicUrl(token), created: true };
}

export async function rotatePropertyGuestAccessToken(propertyId: string): Promise<{
  token: string;
  stayUrl: string;
}> {
  const token = generateGuestAccessToken();
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      guestAccessToken: token,
      guestAccessTokenCreatedAt: new Date(),
      guestAccessRevokedAt: null,
    },
  });
  return { token, stayUrl: stayPublicUrl(token) };
}

export async function revokePropertyGuestAccessToken(propertyId: string): Promise<void> {
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      guestAccessRevokedAt: new Date(),
    },
  });
}
