/**
 * Phase 1B/1D — property-scoped opaque guest stay access.
 * Token authorizes stay resolve only; never encodes property/customer/db identity.
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { appBaseUrl } from '@/lib/feedback/serviceFeedback';
import { logAuditEntry } from '@/lib/audit';

const TOKEN_BYTES = 32;

export const GUEST_ACCESS_AUDIT = {
  ENSURED: 'GUEST_ACCESS_ENSURED',
  ROTATED: 'GUEST_ACCESS_ROTATED',
  REVOKED: 'GUEST_ACCESS_REVOKED',
} as const;

export const PRINTED_CARD_WARNING =
  'Rotating or revoking this guest-access token will make existing printed QR cards stop working and require replacement.';

export type GuestAccessActor = {
  actorId?: string | null;
  actorRole: 'CUSTOMER' | 'ADMIN';
};

export function generateGuestAccessToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function stayPublicUrl(token: string): string {
  return `${appBaseUrl()}/stay/${encodeURIComponent(token)}`;
}

export type ActiveGuestProperty = {
  id: string;
  guestDisplayName: string | null;
  guestAccessToken: string;
};

/**
 * Lookup by opaque token. Revoked, missing, or owner-archived → null (opaque failure).
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
      Customer: { archivedAt: null },
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

export function isGuestDisplayNameReady(
  guestDisplayName: string | null | undefined
): boolean {
  return Boolean(guestDisplayName?.trim());
}

/** Safe admin/host inspection — never includes raw token. */
export type PropertyGuestAccessPublicState = {
  stayUrl: string | null;
  guestDisplayName: string | null;
  active: boolean;
  qrReady: boolean;
  tokenCreatedAt: string | null;
  revokedAt: string | null;
  printedCardWarning: string;
};

/** Read-only guest-access state. Never creates, rotates, or reactivates tokens. */
export async function getPropertyGuestAccessState(
  propertyId: string
): Promise<PropertyGuestAccessPublicState> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      guestAccessToken: true,
      guestAccessTokenCreatedAt: true,
      guestAccessRevokedAt: true,
      guestDisplayName: true,
      Customer: { select: { archivedAt: true } },
    },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  const ownerArchived = property.Customer?.archivedAt != null;
  const active =
    !ownerArchived &&
    property.guestAccessToken != null &&
    property.guestAccessRevokedAt == null;
  const displayReady = isGuestDisplayNameReady(property.guestDisplayName);

  return {
    stayUrl: active ? stayPublicUrl(property.guestAccessToken!) : null,
    guestDisplayName: property.guestDisplayName,
    active,
    qrReady: active && displayReady,
    tokenCreatedAt: property.guestAccessTokenCreatedAt?.toISOString() ?? null,
    revokedAt: property.guestAccessRevokedAt?.toISOString() ?? null,
    printedCardWarning: PRINTED_CARD_WARNING,
  };
}

async function auditGuestAccess(
  action: string,
  propertyId: string,
  actor: GuestAccessActor,
  extra?: Record<string, unknown>
): Promise<void> {
  await logAuditEntry({
    actorId: actor.actorId ?? null,
    actorRole: actor.actorRole,
    action,
    entityType: 'Property',
    entityId: propertyId,
    description: `Property guest access ${action.replace('GUEST_ACCESS_', '').toLowerCase()}`,
    changes: {
      propertyId,
      ...extra,
      // Never include raw guestAccessToken
    },
  });
}

export function normalizeGuestDisplayName(
  value: unknown
): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  const name = value.trim().slice(0, 120);
  return name.length > 0 ? name : null;
}

/** Ensure an active token exists for a host-owned property (idempotent). */
export async function ensurePropertyGuestAccessToken(
  propertyId: string,
  actor: GuestAccessActor,
  options?: { guestDisplayName?: string | null }
): Promise<{
  token: string;
  stayUrl: string;
  created: boolean;
  qrReady: boolean;
}> {
  const existing = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      guestAccessToken: true,
      guestAccessRevokedAt: true,
      guestDisplayName: true,
      Customer: { select: { archivedAt: true } },
    },
  });
  if (!existing) throw new Error('Property not found');
  if (existing.Customer?.archivedAt) {
    throw new Error('Cannot enable guest access for an archived customer property');
  }

  if (options?.guestDisplayName !== undefined) {
    await prisma.property.update({
      where: { id: propertyId },
      data: { guestDisplayName: options.guestDisplayName },
    });
  }

  const displayName =
    options?.guestDisplayName !== undefined
      ? options.guestDisplayName
      : existing.guestDisplayName;

  if (!isGuestDisplayNameReady(displayName)) {
    throw new Error(
      'Set a guest-facing display name before enabling the stay QR link (never use the street address).'
    );
  }

  if (
    existing.guestAccessToken &&
    existing.guestAccessRevokedAt == null
  ) {
    return {
      token: existing.guestAccessToken,
      stayUrl: stayPublicUrl(existing.guestAccessToken),
      created: false,
      qrReady: true,
    };
  }

  const token = generateGuestAccessToken();
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      guestAccessToken: token,
      guestAccessTokenCreatedAt: new Date(),
      guestAccessRevokedAt: null,
      ...(options?.guestDisplayName !== undefined
        ? { guestDisplayName: options.guestDisplayName }
        : {}),
    },
  });

  await auditGuestAccess(GUEST_ACCESS_AUDIT.ENSURED, propertyId, actor, {
    created: true,
  });

  return {
    token,
    stayUrl: stayPublicUrl(token),
    created: true,
    qrReady: true,
  };
}

export async function rotatePropertyGuestAccessToken(
  propertyId: string,
  actor: GuestAccessActor,
  options?: { confirmed?: boolean; guestDisplayName?: string | null }
): Promise<{ token: string; stayUrl: string; qrReady: boolean }> {
  if (!options?.confirmed) {
    throw new Error(
      `${PRINTED_CARD_WARNING} Pass confirm: true to proceed.`
    );
  }

  const existing = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      guestDisplayName: true,
      Customer: { select: { archivedAt: true } },
    },
  });
  if (!existing) throw new Error('Property not found');
  if (existing.Customer?.archivedAt) {
    throw new Error('Cannot rotate guest access for an archived customer property');
  }

  const displayName =
    options.guestDisplayName !== undefined
      ? options.guestDisplayName
      : existing.guestDisplayName;
  if (!isGuestDisplayNameReady(displayName)) {
    throw new Error(
      'Set a guest-facing display name before rotating the stay QR link.'
    );
  }

  const token = generateGuestAccessToken();
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      guestAccessToken: token,
      guestAccessTokenCreatedAt: new Date(),
      guestAccessRevokedAt: null,
      ...(options.guestDisplayName !== undefined
        ? { guestDisplayName: options.guestDisplayName }
        : {}),
    },
  });

  await auditGuestAccess(GUEST_ACCESS_AUDIT.ROTATED, propertyId, actor, {
    confirmed: true,
  });

  return {
    token,
    stayUrl: stayPublicUrl(token),
    qrReady: true,
  };
}

export async function revokePropertyGuestAccessToken(
  propertyId: string,
  actor: GuestAccessActor,
  options?: { confirmed?: boolean }
): Promise<void> {
  if (!options?.confirmed) {
    throw new Error(
      `${PRINTED_CARD_WARNING} Pass confirm: true to proceed.`
    );
  }

  const existing = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true },
  });
  if (!existing) throw new Error('Property not found');

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      guestAccessRevokedAt: new Date(),
    },
  });

  await auditGuestAccess(GUEST_ACCESS_AUDIT.REVOKED, propertyId, actor, {
    confirmed: true,
  });
}

/** Revoke all active guest-access tokens for properties owned by a customer. */
export async function revokeGuestAccessForCustomerProperties(
  customerId: string,
  actor: GuestAccessActor
): Promise<{ revokedCount: number }> {
  const active = await prisma.property.findMany({
    where: {
      customerId,
      guestAccessToken: { not: null },
      guestAccessRevokedAt: null,
    },
    select: { id: true },
  });

  if (active.length === 0) return { revokedCount: 0 };

  const now = new Date();
  await prisma.property.updateMany({
    where: {
      id: { in: active.map((p) => p.id) },
      guestAccessRevokedAt: null,
    },
    data: { guestAccessRevokedAt: now },
  });

  for (const p of active) {
    await auditGuestAccess(GUEST_ACCESS_AUDIT.REVOKED, p.id, actor, {
      reason: 'CUSTOMER_ARCHIVE',
      customerId,
      confirmed: true,
    });
  }

  return { revokedCount: active.length };
}
