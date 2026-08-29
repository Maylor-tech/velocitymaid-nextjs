import { describe, expect, it } from 'vitest';
import {
  canTransition,
  isFinalServiceCompletion,
  isSubmittedForQc,
  isTerminalStatus,
} from '../jobStatus';

describe('QC vs final completion', () => {
  it('cleaner finish goes IN_PROGRESS → AWAITING_QC, not COMPLETED', () => {
    expect(canTransition('IN_PROGRESS', 'AWAITING_QC')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'COMPLETED')).toBe(true);
    expect(canTransition('AWAITING_QC', 'COMPLETED')).toBe(true);
    expect(isSubmittedForQc('AWAITING_QC')).toBe(true);
    expect(isSubmittedForQc('COMPLETED')).toBe(false);
    expect(isFinalServiceCompletion('AWAITING_QC')).toBe(false);
    expect(isFinalServiceCompletion('COMPLETED')).toBe(true);
    expect(isTerminalStatus('AWAITING_QC')).toBe(false);
    expect(isTerminalStatus('COMPLETED')).toBe(true);
  });
});
