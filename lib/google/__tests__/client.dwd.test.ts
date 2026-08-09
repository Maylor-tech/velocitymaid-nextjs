/**
 * Calendar-only Domain-Wide Delegation: Drive JWT has no subject; Calendar JWT
 * uses GOOGLE_CALENDAR_IMPERSONATION_EMAIL and calendar.events scope only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const jwtCtor = vi.fn();

vi.mock('google-auth-library', () => ({
  JWT: vi.fn((opts: Record<string, unknown>) => {
    jwtCtor(opts);
    return { __jwtOpts: opts };
  }),
}));

vi.mock('googleapis', () => ({
  google: {
    drive: vi.fn((opts: { auth: { __jwtOpts: Record<string, unknown> } }) => ({
      api: 'drive',
      auth: opts.auth,
    })),
    calendar: vi.fn((opts: { auth: { __jwtOpts: Record<string, unknown> } }) => ({
      api: 'calendar',
      auth: opts.auth,
    })),
  },
}));

import {
  getDriveClient,
  getCalendarClient,
  _resetClientsForTests,
  CALENDAR_SCOPES,
  DRIVE_SCOPES,
} from '../client';

const ENV_KEYS = [
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
  'GOOGLE_CALENDAR_IMPERSONATION_EMAIL',
] as const;

const FAKE_KEY = '-----BEGIN PRIVATE KEY-----\nTEST_KEY_MATERIAL\n-----END PRIVATE KEY-----\n';

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe('Google client JWT construction (Calendar DWD)', () => {
  beforeEach(() => {
    clearEnv();
    _resetClientsForTests();
    jwtCtor.mockClear();
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'velocitymaid-ops@test.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = FAKE_KEY;
  });

  afterEach(() => {
    clearEnv();
    _resetClientsForTests();
  });

  it('Drive client has no subject', () => {
    getDriveClient();
    expect(jwtCtor).toHaveBeenCalledTimes(1);
    const opts = jwtCtor.mock.calls[0][0] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('subject');
    expect(opts.email).toBe('velocitymaid-ops@test.iam.gserviceaccount.com');
    expect(opts.scopes).toEqual([...DRIVE_SCOPES]);
  });

  it('Calendar client uses impersonation subject from env', () => {
    process.env.GOOGLE_CALENDAR_IMPERSONATION_EMAIL = 'hello@velocitymaid.com';
    getCalendarClient();
    expect(jwtCtor).toHaveBeenCalledTimes(1);
    const opts = jwtCtor.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.subject).toBe('hello@velocitymaid.com');
    expect(opts.email).toBe('velocitymaid-ops@test.iam.gserviceaccount.com');
  });

  it('Calendar scopes are calendar.events only', () => {
    process.env.GOOGLE_CALENDAR_IMPERSONATION_EMAIL = 'hello@velocitymaid.com';
    getCalendarClient();
    const opts = jwtCtor.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.scopes).toEqual(['https://www.googleapis.com/auth/calendar.events']);
    expect(opts.scopes).toEqual([...CALENDAR_SCOPES]);
    expect((opts.scopes as string[]).length).toBe(1);
  });

  it('missing Calendar impersonation email fails closed', () => {
    expect(() => getCalendarClient()).toThrow(
      /GOOGLE_CALENDAR_IMPERSONATION_EMAIL is required/
    );
    expect(jwtCtor).not.toHaveBeenCalled();
  });

  it('blank Calendar impersonation email fails closed', () => {
    process.env.GOOGLE_CALENDAR_IMPERSONATION_EMAIL = '   ';
    expect(() => getCalendarClient()).toThrow(
      /GOOGLE_CALENDAR_IMPERSONATION_EMAIL is required/
    );
    expect(jwtCtor).not.toHaveBeenCalled();
  });

  it('Drive remains usable without impersonation email', () => {
    delete process.env.GOOGLE_CALENDAR_IMPERSONATION_EMAIL;
    expect(() => getDriveClient()).not.toThrow();
    const opts = jwtCtor.mock.calls[0][0] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('subject');
  });

  it('does not log key or token values', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    process.env.GOOGLE_CALENDAR_IMPERSONATION_EMAIL = 'hello@velocitymaid.com';
    getDriveClient();
    getCalendarClient();

    const allOutput = [...logSpy.mock.calls, ...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .map(String)
      .join('\n');

    expect(allOutput).not.toContain('TEST_KEY_MATERIAL');
    expect(allOutput).not.toContain(FAKE_KEY);
    expect(allOutput).not.toMatch(/BEGIN PRIVATE KEY/);

    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
