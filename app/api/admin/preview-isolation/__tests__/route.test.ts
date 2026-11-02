import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mock = vi.hoisted(() => ({ auth: vi.fn(), transaction: vi.fn(), execute: vi.fn(), query: vi.fn() }));
vi.mock('@/lib/auth/requireRole', () => ({ requireRole: mock.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: mock.transaction } }));
import { GET } from '../route';

const origin = 'https://velocitymaid-nextjs-git-32a4bd-maylortech007-gmailcoms-projects.vercel.app';
const req = () => new NextRequest(origin + '/api/admin/preview-isolation');
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('DATABASE_URL', 'postgresql://postgres.wfudxrziqyfvrdgnocky:FICTIONAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
  vi.stubEnv('DIRECT_URL', process.env.DATABASE_URL || '');
  for (const name of ['BASE_URL','NEXT_PUBLIC_BASE_URL','NEXT_PUBLIC_APP_URL','NEXTAUTH_URL','STRIPE_BILLING_PORTAL_RETURN_URL']) vi.stubEnv(name, origin);
  vi.stubEnv('DISPATCH_STAGING', 'true');
  vi.stubEnv('DISPATCH_NOTIFICATIONS', 'off');
  vi.stubEnv('DISPATCH_NOTIFICATION_ALLOWLIST', '');
  vi.stubEnv('DISPATCH_WHATSAPP_ALLOWLIST', '');
  vi.stubEnv('INVOICE_REMINDER_STAGES_ENABLED', 'false');
  mock.auth.mockResolvedValue({ role: 'ADMIN' });
  mock.execute.mockResolvedValue(0);
  mock.query.mockResolvedValue([{ db: 'postgres', role: 'postgres', read_only: 'on', bypass: false }]);
  mock.transaction.mockImplementation(async callback => callback({
    $executeRawUnsafe: mock.execute, $queryRawUnsafe: mock.query,
  }));
});
afterEach(() => vi.unstubAllEnvs());

describe('temporary Preview-only isolation diagnostic', () => {
  it.each(['production', 'development', ''])('returns no diagnostic data in %s', async env => {
    vi.stubEnv('VERCEL_ENV', env);
    const result = await GET(req());
    expect(result.status).toBe(404);
    expect(await result.text()).toBe('');
    expect(mock.auth).not.toHaveBeenCalled();
    expect(mock.transaction).not.toHaveBeenCalled();
  });
  it('requires administrator access before any queries', async () => {
    mock.auth.mockRejectedValue(new Error('FICTIONAL_AUTH_DETAIL'));
    const result = await GET(req());
    expect(result.status).toBe(401);
    expect(await result.text()).not.toContain('FICTIONAL_AUTH_DETAIL');
    expect(mock.transaction).not.toHaveBeenCalled();
  });
  it('returns boolean checks with an explicitly unverified dataset; no secret, role or connection values', async () => {
    vi.stubEnv('RESEND_API_KEY', 'FICTIONAL_RESEND_SECRET');
    vi.stubEnv('STRIPE_SECRET_KEY', 'FICTIONAL_STRIPE_SECRET');
    const response = await GET(req());
    const body = await response.json();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.safety).toMatchObject({ previewRuntime: true, notificationsOff: true, expandedRemindersOff: true });
    expect(body.generatedInvoiceOriginMatchesBillingPreview).toBe(true);
    expect(Object.values(body.originsMatchBillingPreview).every(Boolean)).toBe(true);
    expect(body.database).toMatchObject({ connectionOk: true, transactionReadOnly: true, roleMatchesConfigured: true });
    expect(body.fictionalRecords).toBe('unverified');
    expect(mock.execute).toHaveBeenCalledWith('SET TRANSACTION READ ONLY');
    const serialized = JSON.stringify(body);
    for (const value of ['FICTIONAL_PASSWORD', 'FICTIONAL_RESEND_SECRET', 'FICTIONAL_STRIPE_SECRET',
      'wfudxrziqyfvrdgnocky', 'postgresql://', origin]) expect(serialized).not.toContain(value);
  });
  it('does not connect when the configured target is not the verified isolated staging project', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres.other_project:FICTIONAL_PASSWORD@other.pooler.supabase.com/postgres');
    const body = await (await GET(req())).json();
    expect(body.safety.configuredDatabaseIsStaging).toBe(false);
    expect(mock.transaction).not.toHaveBeenCalled();
  });
  it('reports database errors as booleans without exception details', async () => {
    mock.transaction.mockRejectedValue(new Error('FICTIONAL_CONNECTION_STRING_AND_SECRET'));
    const response = await GET(req());
    const body = await response.json();
    expect(body.database.connectionOk).toBe(false);
    expect(JSON.stringify(body)).not.toContain('FICTIONAL_CONNECTION_STRING_AND_SECRET');
  });
  it('flags a production invoice link origin without contacting mail or payment providers', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://velocitymaid.com');
    const body = await (await GET(req())).json();
    expect(body.generatedInvoiceOriginMatchesBillingPreview).toBe(false);
    expect(body.originsMatchBillingPreview.NEXT_PUBLIC_APP_URL).toBe(false);
  });
});
