/**
 * AUTH-01: logout cookie isolation (synthetic). Does not use production credentials.
 * Login/middleware regressions remain in adminSessionHardening.test.ts.
 */
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.stubEnv('NODE_ENV', 'test');

import { GET as logout } from '@/app/api/auth/admin-logout/route';
import { ADMIN_SESSION_MAX_AGE } from '@/lib/auth/adminSession';

function setCookieHeaders(response: Response): string[] {
  const anyHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === 'function') return anyHeaders.getSetCookie();
  const single = response.headers.get('set-cookie');
  return single ? [single] : [];
}

describe('AUTH-01 admin logout cookie clears', () => {
  it('keeps the 30-minute session max-age contract unchanged', () => {
    expect(ADMIN_SESSION_MAX_AGE).toBe(1800);
  });

  it('expires admin_session and legacy aliases without touching customer/cleaner cookies', async () => {
    const request = new NextRequest(
      new URL('https://www.velocitymaid.com/api/auth/admin-logout'),
      {
        headers: {
          cookie:
            'admin_session=synthetic; adminId=legacy; adminSession=legacy; vm_customer_session=keep; cleanerId=keep',
        },
      }
    );
    const response = await logout(request);
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get('location')).toContain('/admin/login');

    const clears = setCookieHeaders(response);
    const adminSession = clears.find((c) => c.startsWith('admin_session='));
    expect(adminSession).toBeTruthy();
    expect(adminSession).toContain('Max-Age=0');
    expect(adminSession).toContain('HttpOnly');
    expect(adminSession!.toLowerCase()).toContain('samesite=strict');
    expect(adminSession).toContain('Path=/');

    expect(clears.some((c) => c.startsWith('adminId=') && c.includes('Max-Age=0'))).toBe(true);
    expect(clears.some((c) => c.startsWith('adminSession=') && c.includes('Max-Age=0'))).toBe(
      true
    );
    expect(clears.some((c) => c.includes('Domain=velocitymaid.com'))).toBe(true);

    expect(clears.some((c) => c.startsWith('vm_customer_session='))).toBe(false);
    expect(clears.some((c) => c.startsWith('cleanerId='))).toBe(false);
  });
});
