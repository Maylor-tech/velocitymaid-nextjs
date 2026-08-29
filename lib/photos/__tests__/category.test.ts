import { describe, expect, it } from 'vitest';
import { parseCleanPhotoCategory } from '../cleanPhotoStorage';

describe('clean photo category defaults', () => {
  it('defaults unknown values to OTHER and never customer-visible at parse time', () => {
    expect(parseCleanPhotoCategory(undefined)).toBe('OTHER');
    expect(parseCleanPhotoCategory('before')).toBe('BEFORE');
    expect(parseCleanPhotoCategory('AFTER')).toBe('AFTER');
  });
});
