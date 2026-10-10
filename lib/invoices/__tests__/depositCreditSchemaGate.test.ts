import { describe, expect, it } from 'vitest';
import {
  DEPOSIT_CREDIT_UNIQUE_INDEX,
  assertDepositCreditWritesEnabled,
  depositCreditUniqueIndexPresent,
} from '../depositCreditSchemaGate';

describe('depositCreditSchemaGate', () => {
  it('treats the unique index as present only when pg_indexes returns it', () => {
    expect(depositCreditUniqueIndexPresent([])).toBe(false);
    expect(depositCreditUniqueIndexPresent([{ indexname: 'other' }])).toBe(false);
    expect(
      depositCreditUniqueIndexPresent([{ indexname: DEPOSIT_CREDIT_UNIQUE_INDEX }])
    ).toBe(true);
  });

  it('blocks writes when the migration index is missing', () => {
    try {
      assertDepositCreditWritesEnabled([]);
      throw new Error('expected MIGRATION_REQUIRED');
    } catch (error) {
      expect(error).toMatchObject({ code: 'MIGRATION_REQUIRED', status: 503 });
    }
  });

  it('allows writes when invoice_payment_intent_once exists', () => {
    expect(() =>
      assertDepositCreditWritesEnabled([{ indexname: DEPOSIT_CREDIT_UNIQUE_INDEX }])
    ).not.toThrow();
  });
});
