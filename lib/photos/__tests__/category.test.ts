import { describe, expect, it } from 'vitest';
import { parseCleanPhotoCategory, stablePhotoStoragePath } from '../cleanPhotoStorage';

describe('clean photo category defaults', () => {
  it('defaults unknown values to OTHER and never customer-visible at parse time', () => {
    expect(parseCleanPhotoCategory(undefined)).toBe('OTHER');
    expect(parseCleanPhotoCategory('before')).toBe('BEFORE');
    expect(parseCleanPhotoCategory('AFTER')).toBe('AFTER');
  });

  it('reuses one storage path for a retried upload', () => {
    const first = stablePhotoStoragePath('job-1', 'upl-abc', 'lamp.jpg');
    const retry = stablePhotoStoragePath('job-1', 'upl-abc', 'lamp.jpg');
    expect(retry).toBe(first);
    expect(first).not.toContain('..');
  });
});
