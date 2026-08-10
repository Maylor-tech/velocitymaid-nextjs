import { describe, it, expect } from 'vitest';
import {
  addressesMatch,
  normalizeAddressKey,
} from '@/lib/properties/normalizeAddress';

describe('normalizeAddressKey / addressesMatch', () => {
  it('normalizes drive/street variants and punctuation', () => {
    expect(normalizeAddressKey('111 Thomson Drive')).toBe('111 thomson dr');
    expect(normalizeAddressKey('111 Thomson Dr.')).toBe('111 thomson dr');
  });

  it('matches Lou Lou style address variants', () => {
    expect(
      addressesMatch('111 Thomson Drive', '111 Thomson drive')
    ).toBe(true);
    expect(
      addressesMatch('111 Thomson Drive, Ludlow, VT', '111 Thomson Drive')
    ).toBe(true);
  });

  it('does not match different streets', () => {
    expect(
      addressesMatch('111 Thomson Drive', '198 Chipman Park')
    ).toBe(false);
  });
});
