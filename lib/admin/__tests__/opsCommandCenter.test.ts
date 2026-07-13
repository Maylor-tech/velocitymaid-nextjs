import { describe, expect, it } from 'vitest';
import {
  bucketInvoiceDueDate,
  categorizePropertyAlertText,
  standardActiveCustomerWhere,
} from '@/lib/admin/opsCommandCenter';

describe('categorizePropertyAlertText', () => {
  it('maps supplies source to Supplies', () => {
    expect(categorizePropertyAlertText('anything', 'supplies')).toBe('Supplies');
  });

  it('maps compliance source to Damage', () => {
    expect(categorizePropertyAlertText('scratch on wall', 'compliance')).toBe('Damage');
  });

  it('buckets issue keywords', () => {
    expect(categorizePropertyAlertText('hot tub cloudy', 'issues')).toBe('Hot tub');
    expect(categorizePropertyAlertText('trash left out', 'issues')).toBe('Trash');
    expect(categorizePropertyAlertText('lockbox code failed', 'issues')).toBe('Access');
    expect(categorizePropertyAlertText('broken vase damage', 'issues')).toBe('Damage');
    expect(categorizePropertyAlertText('need more paper towels', 'issues')).toBe('Supplies');
    expect(categorizePropertyAlertText('HVAC needs repair', 'issues')).toBe('Maintenance');
    expect(categorizePropertyAlertText('general note', 'issues')).toBe('Unresolved');
  });
});

describe('bucketInvoiceDueDate', () => {
  // Local dates — dateRanges helpers use setHours (local timezone)
  const now = new Date(2026, 6, 13, 15, 0, 0);

  it('treats OVERDUE status as overdue', () => {
    expect(bucketInvoiceDueDate(new Date(2026, 6, 20), 'OVERDUE', now)).toBe('overdue');
  });

  it('buckets by due date relative to today', () => {
    expect(bucketInvoiceDueDate(new Date(2026, 6, 10, 12), 'SENT', now)).toBe('overdue');
    expect(bucketInvoiceDueDate(new Date(2026, 6, 13, 12), 'SENT', now)).toBe('dueToday');
    expect(bucketInvoiceDueDate(new Date(2026, 6, 16, 12), 'SENT', now)).toBe('dueThisWeek');
    expect(bucketInvoiceDueDate(new Date(2026, 7, 1, 12), 'SENT', now)).toBe('other');
  });

  it('returns other when due date is null and not OVERDUE', () => {
    expect(bucketInvoiceDueDate(null, 'SENT', now)).toBe('other');
  });
});

describe('standardActiveCustomerWhere', () => {
  it('excludes archived and non-STANDARD record kinds', () => {
    expect(standardActiveCustomerWhere).toEqual({
      archivedAt: null,
      recordKind: 'STANDARD',
    });
  });
});
