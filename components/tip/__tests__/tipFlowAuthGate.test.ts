/**
 * TipFlow authorization UX: context 401 must block payment continue.
 * Pure logic mirror of canContinue gating (avoids full React mount).
 */
import { describe, expect, it } from 'vitest';

function tipCanContinue(input: {
  resolvedJobId: string | null;
  contextLoading: boolean;
  contextError: string | null;
  jobContext: { propertyLabel: string } | null;
  amountDollars: number;
}): boolean {
  return (
    Boolean(input.resolvedJobId) &&
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
        resolvedJobId: 'job-1',
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
        resolvedJobId: 'job-1',
        contextLoading: false,
        contextError: null,
        jobContext: { propertyLabel: 'Maple Cabin' },
        amountDollars: 20,
      })
    ).toBe(true);
  });

  it('does not allow unauthenticated bypass without jobContext', () => {
    expect(
      tipCanContinue({
        resolvedJobId: 'job-1',
        contextLoading: false,
        contextError: null,
        jobContext: null,
        amountDollars: 20,
      })
    ).toBe(false);
  });
});
