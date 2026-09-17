/**
 * WorkerDocument metadata only.
 * Records that a document was requested/received — never stores SSN/TIN/bank credentials.
 */

export const DOCUMENT_STATUSES = [
  'NOT_REQUESTED',
  'REQUESTED',
  'RECEIVED',
  'REJECTED',
  'EXPIRED',
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_TYPES = ['W9_META', 'AGREEMENT_PACKET', 'OTHER'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export function isDocumentStatus(value: unknown): value is DocumentStatus {
  return (
    typeof value === 'string' &&
    (DOCUMENT_STATUSES as readonly string[]).includes(value)
  );
}

export function isDocumentType(value: unknown): value is DocumentType {
  return (
    typeof value === 'string' &&
    (DOCUMENT_TYPES as readonly string[]).includes(value)
  );
}
