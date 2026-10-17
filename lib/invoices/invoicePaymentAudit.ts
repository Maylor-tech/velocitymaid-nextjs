/**
 * AuditLog.actorId is an optional FK to User.
 * A non-user sentinel such as the legacy dev bypass "local-admin"
 * makes the insert fail, and the failure used to drop the whole audit row.
 *
 * This helper does not authenticate or authorize. Payment routes call
 * requireRole before recordInvoicePayment. A rejected id is stored only as
 * audit metadata (unresolvedActorId / actorIdRejected) and is never treated
 * as a session or a permission.
 */

export const NON_USER_ACTOR_SENTINELS = new Set(['local-admin']);

export type InvoicePaymentActorRole = 'ADMIN' | 'SYSTEM';

export type InvoicePaymentAuditAttribution = {
  actorId: string | null;
  actorRole: InvoicePaymentActorRole;
  /** Present when a caller supplied an id that must not be stored on the User FK. */
  unresolvedActorId?: string;
};

export function attributeInvoicePaymentAudit(input: {
  actorId?: string | null;
  actorRole?: InvoicePaymentActorRole | null;
}): InvoicePaymentAuditAttribution {
  const raw = input.actorId?.trim() ?? '';
  const persistActorId =
    raw && !NON_USER_ACTOR_SENTINELS.has(raw) ? raw : null;
  const actorRole: InvoicePaymentActorRole =
    input.actorRole ?? (raw ? 'ADMIN' : 'SYSTEM');

  return {
    actorId: persistActorId,
    actorRole,
    ...(raw && !persistActorId ? { unresolvedActorId: raw } : {}),
  };
}
