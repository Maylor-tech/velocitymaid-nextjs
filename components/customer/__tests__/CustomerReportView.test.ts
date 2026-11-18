import { describe, expect, it } from 'vitest';
import { isQcApproved } from '../CustomerReportView';

describe('isQcApproved', () => {
  it('is true only for APPROVED reviewStatus', () => {
    expect(isQcApproved('APPROVED')).toBe(true);
    expect(isQcApproved('PENDING')).toBe(false);
    expect(isQcApproved('REJECTED')).toBe(false);
    expect(isQcApproved(null)).toBe(false);
  });
});
