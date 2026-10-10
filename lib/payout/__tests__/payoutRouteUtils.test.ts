import { describe, expect, it } from 'vitest';
import {
  asPolicyDetails,
  mergeExecutionNote,
  payoutAmountNumber,
  payoutErrorMessage,
} from '../payoutRouteUtils';

describe('payoutRouteUtils', () => {
  it('narrows policy JSON without dropping existing keys', () => {
    expect(asPolicyDetails(null)).toEqual({});
    expect(asPolicyDetails({ adminDecision: { action: 'APPROVED' } })).toEqual({
      adminDecision: { action: 'APPROVED' },
    });
  });

  it('stores execution notes on policyEvalDetails, not a missing column', () => {
    const live = mergeExecutionNote({ keep: true }, 'wired zelle', false);
    expect(live.executionNote).toBe('wired zelle');
    expect(live.policyEvalDetails).toEqual({ keep: true, executionNote: 'wired zelle' });

    const demo = mergeExecutionNote({}, null, true);
    expect(demo.executionNote).toBe(' [DEMO MODE]');
    expect(demo.policyEvalDetails.executionNote).toBe(' [DEMO MODE]');
  });

  it('converts Prisma-like decimals without changing cents', () => {
    expect(payoutAmountNumber(276.25)).toBe(276.25);
    expect(payoutAmountNumber('162.50')).toBe(162.5);
  });

  it('reads Error messages and falls back for unknown throws', () => {
    expect(payoutErrorMessage(new Error('held'), 'fallback')).toBe('held');
    expect(payoutErrorMessage('nope', 'fallback')).toBe('fallback');
  });
});
