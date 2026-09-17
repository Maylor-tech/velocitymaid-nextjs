/**
 * Exactly one mutation key per admin worker-record PATCH.
 * Prevents partial writes when a later operation fails after an earlier one.
 */

export function countAdminWorkerRecordOperations(body: Record<string, unknown>): {
  count: number;
  hasPatch: boolean;
  hasAgreement: boolean;
  hasDocument: boolean;
} {
  const hasPatch = !!(body.patch && typeof body.patch === 'object');
  const hasAgreement = !!(body.agreement && typeof body.agreement === 'object');
  const hasDocument = !!(body.document && typeof body.document === 'object');
  return {
    count: Number(hasPatch) + Number(hasAgreement) + Number(hasDocument),
    hasPatch,
    hasAgreement,
    hasDocument,
  };
}
