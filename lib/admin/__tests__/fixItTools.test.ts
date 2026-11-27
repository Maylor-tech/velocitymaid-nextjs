import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/audit', () => ({ logAuditEntry: vi.fn() }));
vi.mock('@/lib/google/jobGoogleSync', () => ({ awaitJobCalendarSync: vi.fn(), awaitJobCalendarCancel: vi.fn() }));
vi.mock('@/lib/notifications/cleanerCancellationEmail', () => ({ notifyCleanerOfJobCancellation: vi.fn() }));
vi.mock('@/lib/admin/applyAdminTerminalCancellation', () => ({ applyAdminTerminalCancellation: vi.fn() }));
import { changesFromPayload, ChangeRequestError } from '../changeRequests';
import { mergeBlocker } from '../mergeDuplicateJob';

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe('changesFromPayload', () => {
  it('moves the clean and its checkout day together when they were the same day', () => {
    const c = changesFromPayload({ newDate: '2027-02-20' }, { preferredDate: d('2027-02-21'), guestCheckOutDate: d('2027-02-21') });
    expect(c.preferredDate?.toISOString()).toBe('2027-02-20T00:00:00.000Z');
    expect(c.guestCheckOutDate?.toISOString()).toBe('2027-02-20T00:00:00.000Z');
  });
  it('leaves a different checkout day alone', () => {
    const c = changesFromPayload({ newDate: '2027-02-20' }, { preferredDate: d('2027-02-21'), guestCheckOutDate: d('2027-02-19') });
    expect(c.guestCheckOutDate).toBeUndefined();
  });
  it('flags address and length changes for a person to handle', () => {
    const c = changesFromPayload({ newAddress: '1 Main St', newDuration: 5, notes: 'x' }, { preferredDate: null, guestCheckOutDate: null });
    expect(c.preferredDate).toBeUndefined();
    expect(c.manualFollowUp).toHaveLength(2);
  });
  it('rejects a bad date', () => {
    expect(() => changesFromPayload({ newDate: 'not a date' }, { preferredDate: null, guestCheckOutDate: null })).toThrow(ChangeRequestError);
  });
});

describe('mergeBlocker', () => {
  const dup = { id: 'a', status: 'RECEIVED', propertyId: 'p', amountPaid: 0, hasPayout: false };
  const keep = { id: 'b', status: 'RECEIVED', propertyId: 'p' };
  it('allows an untouched duplicate at the same property', () => {
    expect(mergeBlocker(dup, keep)).toBeNull();
  });
  it('refuses other properties, itself, started cleans, cancelled keepers and money', () => {
    expect(mergeBlocker(dup, { ...keep, propertyId: 'q' })).toMatch(/same property/);
    expect(mergeBlocker(dup, { ...keep, id: 'a' })).toMatch(/different clean/);
    expect(mergeBlocker({ ...dup, status: 'IN_PROGRESS' }, keep)).toMatch(/not started/);
    expect(mergeBlocker(dup, { ...keep, status: 'CANCELLED' })).toMatch(/cancelled/);
    expect(mergeBlocker({ ...dup, amountPaid: 265 }, keep)).toMatch(/money/);
    expect(mergeBlocker(dup, null)).toMatch(/not found/);
  });
});
