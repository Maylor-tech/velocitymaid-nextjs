import { createHash } from 'node:crypto';
import type { RebookingProviderRequest } from '@/lib/email/cronAutomationEmails';

/**
 * Canonical provider request for one rebooking reminder.
 * Optional fields that this sender does not use are explicit nulls so a later
 * addition cannot hash as "absent" and then send as a different value.
 * Key order is alphabetical. The hash is lowercase hex SHA-256 of that JSON.
 */
export function canonicalRebookingProviderRequest(request: RebookingProviderRequest): string {
  return JSON.stringify({
    attachments: null,
    bcc: null,
    cc: null,
    from: request.from,
    headers: null,
    html: request.html,
    idempotencyKey: request.idempotencyKey,
    replyTo: null,
    subject: request.subject,
    text: request.text,
    to: request.to,
  });
}

export function fingerprintRebookingProviderRequest(request: RebookingProviderRequest): string {
  return createHash('sha256').update(canonicalRebookingProviderRequest(request), 'utf8').digest('hex');
}

export const REBOOKING_FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;
