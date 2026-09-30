/**
 * Gate 3 — timezone UTC-midnight semantics for stay/service dates (lib-safe).
 */
import { describe, expect, it } from 'vitest';
import { parseServiceDateInput, serviceDateKey } from '@/lib/dates/serviceDate';

describe('Gate 3 timezone: stay/service dates are UTC midnight', () => {
  it('parseServiceDateInput encodes Vermont-safe UTC midnight', () => {
    const d = parseServiceDateInput('2026-10-01');
    expect(d?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(serviceDateKey(d)).toBe('2026-10-01');
  });

  it('admin date input round-trip via ISO slice does not shift day', () => {
    const stored = parseServiceDateInput('2026-10-04')!;
    const formValue = stored.toISOString().slice(0, 10);
    expect(formValue).toBe('2026-10-04');
    const rewritten = parseServiceDateInput(formValue)!;
    expect(rewritten.toISOString()).toBe('2026-10-04T00:00:00.000Z');
  });

  it('rejects invalid calendar dates', () => {
    expect(parseServiceDateInput('2026-02-30')).toBeNull();
    expect(parseServiceDateInput('not-a-date')).toBeNull();
  });
});
