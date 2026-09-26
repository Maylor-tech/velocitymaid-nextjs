import { describe, expect, it } from 'vitest';
import {
  CUSTOMER_PORTAL_HOME,
  resolveCustomerPostLoginRedirect,
} from '../postLoginRedirect';

describe('resolveCustomerPostLoginRedirect', () => {
  it('defaults null/empty/missing to /customer/jobs', () => {
    expect(resolveCustomerPostLoginRedirect(null)).toBe(CUSTOMER_PORTAL_HOME);
    expect(resolveCustomerPostLoginRedirect(undefined)).toBe(CUSTOMER_PORTAL_HOME);
    expect(resolveCustomerPostLoginRedirect('')).toBe(CUSTOMER_PORTAL_HOME);
    expect(resolveCustomerPostLoginRedirect('   ')).toBe(CUSTOMER_PORTAL_HOME);
  });

  it('normalizes /customer/home to /customer/jobs', () => {
    expect(resolveCustomerPostLoginRedirect('/customer/home')).toBe(
      CUSTOMER_PORTAL_HOME
    );
    expect(resolveCustomerPostLoginRedirect('/customer/home/')).toBe(
      CUSTOMER_PORTAL_HOME
    );
  });

  it('normalizes /customer/dashboard to /customer/jobs', () => {
    expect(resolveCustomerPostLoginRedirect('/customer/dashboard')).toBe(
      CUSTOMER_PORTAL_HOME
    );
  });

  it('normalizes bare /customer to /customer/jobs', () => {
    expect(resolveCustomerPostLoginRedirect('/customer')).toBe(
      CUSTOMER_PORTAL_HOME
    );
  });

  it('preserves valid supported static destinations', () => {
    expect(resolveCustomerPostLoginRedirect('/customer/jobs')).toBe(
      '/customer/jobs'
    );
    expect(resolveCustomerPostLoginRedirect('/customer/referrals')).toBe(
      '/customer/referrals'
    );
    expect(resolveCustomerPostLoginRedirect('/customer/properties')).toBe(
      '/customer/properties'
    );
    expect(resolveCustomerPostLoginRedirect('/customer/profile')).toBe(
      '/customer/profile'
    );
    expect(
      resolveCustomerPostLoginRedirect('/customer/jobs?created=abc&needTipJob=1')
    ).toBe('/customer/jobs?created=abc&needTipJob=1');
    expect(
      resolveCustomerPostLoginRedirect('/customer/payments?tab=invoices')
    ).toBe('/customer/payments?tab=invoices');
  });

  it('preserves valid dynamic job/property destinations', () => {
    const jobId = '65b887a3-5086-4e9c-bc1e-513f6432ce40';
    const propId = 'fe494d88-f9bc-41c5-9a76-46daa87b43a6';
    expect(resolveCustomerPostLoginRedirect(`/customer/jobs/${jobId}`)).toBe(
      `/customer/jobs/${jobId}`
    );
    expect(
      resolveCustomerPostLoginRedirect(
        `/customer/jobs/${jobId}?balance=success`
      )
    ).toBe(`/customer/jobs/${jobId}?balance=success`);
    expect(
      resolveCustomerPostLoginRedirect(`/customer/properties/${propId}`)
    ).toBe(`/customer/properties/${propId}`);
    expect(
      resolveCustomerPostLoginRedirect(
        `/customer/properties/${propId}/add-cleaning`
      )
    ).toBe(`/customer/properties/${propId}/add-cleaning`);
    expect(
      resolveCustomerPostLoginRedirect(`/customer/booking/${jobId}`)
    ).toBe(`/customer/booking/${jobId}`);
  });

  it('falls back when /customer/foo (nonexistent) is supplied', () => {
    expect(resolveCustomerPostLoginRedirect('/customer/foo')).toBe(
      CUSTOMER_PORTAL_HOME
    );
    expect(resolveCustomerPostLoginRedirect('/customer/job')).toBe(
      CUSTOMER_PORTAL_HOME
    );
  });

  it('rejects /admin', () => {
    expect(resolveCustomerPostLoginRedirect('/admin')).toBe(CUSTOMER_PORTAL_HOME);
    expect(resolveCustomerPostLoginRedirect('/admin/jobs')).toBe(
      CUSTOMER_PORTAL_HOME
    );
  });

  it('rejects /book as an auth continuation', () => {
    expect(resolveCustomerPostLoginRedirect('/book')).toBe(CUSTOMER_PORTAL_HOME);
    expect(resolveCustomerPostLoginRedirect('/book?rebook=1')).toBe(
      CUSTOMER_PORTAL_HOME
    );
  });

  it('rejects absolute external URLs', () => {
    expect(
      resolveCustomerPostLoginRedirect('https://evil.example/phish')
    ).toBe(CUSTOMER_PORTAL_HOME);
    expect(
      resolveCustomerPostLoginRedirect('http://evil.example')
    ).toBe(CUSTOMER_PORTAL_HOME);
    expect(
      resolveCustomerPostLoginRedirect('https://www.velocitymaid.com/customer/jobs')
    ).toBe(CUSTOMER_PORTAL_HOME);
  });

  it('rejects protocol-relative URLs', () => {
    expect(resolveCustomerPostLoginRedirect('//evil.example')).toBe(
      CUSTOMER_PORTAL_HOME
    );
    expect(resolveCustomerPostLoginRedirect('//evil.example/path')).toBe(
      CUSTOMER_PORTAL_HOME
    );
  });

  it('rejects encoded/malformed attempts to escape the portal', () => {
    expect(
      resolveCustomerPostLoginRedirect('/%2F%2Fevil.example')
    ).toBe(CUSTOMER_PORTAL_HOME);
    expect(
      resolveCustomerPostLoginRedirect('/customer/%2e%2e/admin')
    ).toBe(CUSTOMER_PORTAL_HOME);
    expect(
      resolveCustomerPostLoginRedirect('/customer/jobs/%2e%2e/%2e%2e/admin')
    ).toBe(CUSTOMER_PORTAL_HOME);
    expect(
      resolveCustomerPostLoginRedirect('javascript:alert(1)')
    ).toBe(CUSTOMER_PORTAL_HOME);
    expect(
      resolveCustomerPostLoginRedirect('/\\evil.example')
    ).toBe(CUSTOMER_PORTAL_HOME);
    // Double-encoded protocol-relative
    expect(
      resolveCustomerPostLoginRedirect('/%252F%252Fevil.example')
    ).toBe(CUSTOMER_PORTAL_HOME);
  });

  it('rejects cleaner and unrelated application routes', () => {
    expect(resolveCustomerPostLoginRedirect('/cleaner/jobs')).toBe(
      CUSTOMER_PORTAL_HOME
    );
    expect(resolveCustomerPostLoginRedirect('/cleaners/login')).toBe(
      CUSTOMER_PORTAL_HOME
    );
    expect(resolveCustomerPostLoginRedirect('/saas/dashboard')).toBe(
      CUSTOMER_PORTAL_HOME
    );
  });

  it('magic-link default (null redirect) remains /customer/jobs', () => {
    expect(resolveCustomerPostLoginRedirect(null)).toBe('/customer/jobs');
  });

  it('strips disallowed query keys on otherwise safe paths', () => {
    expect(
      resolveCustomerPostLoginRedirect(
        '/customer/jobs?created=1&redirect=https://evil.example'
      )
    ).toBe('/customer/jobs?created=1');
  });
});
