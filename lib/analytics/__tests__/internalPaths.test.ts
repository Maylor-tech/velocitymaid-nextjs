import { describe, expect, it } from 'vitest';
import { isInternalPath } from '../internalPaths';

describe('isInternalPath', () => {
  it.each([
    '/admin',
    '/admin/login',
    '/admin/jobs/123',
    '/dashboard',
    '/cleaner',
    '/cleaner/jobs',
    '/cleaner/upload/abc',
    '/cleaners/login',
    '/customer/login',
    '/customer/properties/x/add-cleaning',
    '/invoice/cmvreb5lv0007l508aoq3gv0h',
    '/report/preview-pay',
    '/dev/cleaner-pay-visual',
    '/saas/login',
    '/branch-owner',
    '/pilot/x',
  ])('treats %s as internal', (path) => {
    expect(isInternalPath(path)).toBe(true);
  });

  it.each([
    '/',
    '/hosts',
    '/pricing',
    '/contact',
    '/vermont',
    '/vermont/host-intake',
    '/vermont/work-with-us',
    '/vermont/home-watch',
    '/new-jersey',
    '/cleaners/apply',
    '/cleaners/apply/success',
    '/residential',
    '/administrator-tips',
    '/reports-are-public-name',
    '/tip',
  ])('keeps %s tracked', (path) => {
    expect(isInternalPath(path)).toBe(false);
  });

  it('handles empty values', () => {
    expect(isInternalPath(null)).toBe(false);
    expect(isInternalPath(undefined)).toBe(false);
    expect(isInternalPath('')).toBe(false);
  });
});
