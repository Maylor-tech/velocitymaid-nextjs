import { DepositCreditError } from './depositCreditError';

export const DEPOSIT_CREDIT_UNIQUE_INDEX = 'invoice_payment_intent_once';
export const DEPOSIT_CREDIT_MIGRATION = '20261010180000_invoice_payment_deposit_pi_unique';

export function depositCreditUniqueIndexPresent(rows: unknown): boolean {
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => {
    if (!row || typeof row !== 'object' || !('indexname' in row)) return false;
    return (row as { indexname: unknown }).indexname === DEPOSIT_CREDIT_UNIQUE_INDEX;
  });
}

export function assertDepositCreditWritesEnabled(rows: unknown): void {
  if (depositCreditUniqueIndexPresent(rows)) return;
  throw new DepositCreditError(
    'MIGRATION_REQUIRED',
    `Deposit credit writes are blocked until migration ${DEPOSIT_CREDIT_MIGRATION} is applied.`,
    503
  );
}
