import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyCronAuth } from '../verifyCronAuth';

const SECRET = 'test-cron-secret';

function request(authorization?: string) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set('authorization', authorization);
  return new NextRequest('http://localhost/api/cron/test', { headers });
}

describe('verifyCronAuth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects a missing secret without describing the configuration', async () => {
    vi.stubEnv('CRON_SECRET', undefined as unknown as string);
    delete process.env.CRON_SECRET;
    const response = verifyCronAuth(request(`Bearer ${SECRET}`));
    const body = await response?.json();
    expect(response?.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(JSON.stringify(body)).not.toContain(SECRET);
  });

  it('rejects an empty or blank secret', async () => {
    for (const value of ['', '   ']) {
      vi.stubEnv('CRON_SECRET', value);
      const response = verifyCronAuth(request('Bearer '));
      expect(response?.status).toBe(401);
      expect(await response?.json()).toEqual({ error: 'Unauthorized' });
    }
  });

  it('rejects a missing or incorrect bearer token', async () => {
    vi.stubEnv('CRON_SECRET', SECRET);
    const attempts = [undefined, '', 'Bearer', `bearer ${SECRET}`, 'Bearer wrong-secret', SECRET];
    for (const authorization of attempts) {
      const response = verifyCronAuth(request(authorization));
      expect(response?.status).toBe(401);
      const body = await response?.json();
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(JSON.stringify(body)).not.toContain(SECRET);
    }
  });

  it('accepts the exact bearer token', () => {
    vi.stubEnv('CRON_SECRET', SECRET);
    expect(verifyCronAuth(request(`Bearer ${SECRET}`))).toBeNull();
  });
});
