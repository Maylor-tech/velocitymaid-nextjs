/**
 * TipFlow authorization UX: context failure must block payment continue.
 */
import { describe, expect, it } from 'vitest';

function tipCanContinue(input: {
  authMode: 'CUSTOMER' | 'GUEST_GRANT' | null;
  contextLoading: boolean;
  contextError: string | null;
  jobContext: { propertyLabel: string } | null;
  amountDollars: number;
}): boolean {
  return (
    Boolean(input.authMode) &&
    !input.contextLoading &&
    !input.contextError &&
    Boolean(input.jobContext) &&
    input.amountDollars >= 1 &&
    input.amountDollars <= 200 &&
    !Number.isNaN(input.amountDollars)
  );
}

describe('TipFlow canContinue after context auth', () => {
  it('blocks continue when context returned 401 (sign-in required)', () => {
    expect(
      tipCanContinue({
        authMode: 'CUSTOMER',
        contextLoading: false,
        contextError:
          'Please sign in and open the completed cleaning from My Jobs to leave a tip.',
        jobContext: null,
        amountDollars: 20,
      })
    ).toBe(false);
  });

  it('allows continue only with authorized loaded context', () => {
    expect(
      tipCanContinue({
        authMode: 'CUSTOMER',
        contextLoading: false,
        contextError: null,
        jobContext: { propertyLabel: 'Lake House' },
        amountDollars: 20,
      })
    ).toBe(true);
  });

  it('allows guest grant mode with loaded context', () => {
    expect(
      tipCanContinue({
        authMode: 'GUEST_GRANT',
        contextLoading: false,
        contextError: null,
        jobContext: { propertyLabel: 'this property' },
        amountDollars: 15,
      })
    ).toBe(true);
  });

  it('blocks when no auth mode', () => {
    expect(
      tipCanContinue({
        authMode: null,
        contextLoading: false,
        contextError: null,
        jobContext: { propertyLabel: 'X' },
        amountDollars: 20,
      })
    ).toBe(false);
  });
});
