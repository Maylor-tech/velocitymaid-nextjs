/** WorkerAgreement metadata statuses. Application checkboxes are NOT signed agreements. */

export const AGREEMENT_STATUSES = ['PENDING', 'SIGNED', 'SUPERSEDED', 'VOID'] as const;
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

export const AGREEMENT_TYPES = [
  'VERMONT_WORKER_AGREEMENT',
  'JAMAICA_CONTRACT',
  'OTHER',
] as const;
export type AgreementType = (typeof AGREEMENT_TYPES)[number];

export function isAgreementStatus(value: unknown): value is AgreementStatus {
  return (
    typeof value === 'string' &&
    (AGREEMENT_STATUSES as readonly string[]).includes(value)
  );
}
