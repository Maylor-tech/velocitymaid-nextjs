import { describe, expect, it } from 'vitest';
import {
  isEmailIdentifier,
  nationalPhoneDigits,
  normalizePhoneDigits,
  phonesMatch,
} from '@/lib/cleaners/phoneIdentity';

describe('phoneIdentity', () => {
  it('strips formatting to digits', () => {
    expect(normalizePhoneDigits('+1 (802) 555-0100')).toBe('18025550100');
    expect(nationalPhoneDigits('18025550100')).toBe('8025550100');
  });

  it('matches stored formatted phone to typed international input', () => {
    expect(phonesMatch('(802) 555-0100', '+1 802-555-0100')).toBe(true);
    expect(phonesMatch('+18025550100', '8025550100')).toBe(true);
  });

  it('does not match a different number', () => {
    expect(phonesMatch('8025550100', '8025550199')).toBe(false);
    expect(phonesMatch(null, '8025550100')).toBe(false);
  });

  it('detects email identifiers', () => {
    expect(isEmailIdentifier('dorottya@example.com')).toBe(true);
    expect(isEmailIdentifier('+18025550100')).toBe(false);
  });
});
