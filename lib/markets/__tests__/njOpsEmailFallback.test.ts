import { describe, expect, it } from 'vitest';
import {
  resolveNjLeadsCompanyEmail,
  resolveNjOpsFollowUpEmail,
} from '@/lib/markets/notifyNjLeadFollowUp';

describe('NJ ops email fallback helpers', () => {
  it('prefers NJ_OPS_FOLLOWUP_EMAIL then ELAINE_OPS_EMAIL then CONTACT', () => {
    expect(
      resolveNjOpsFollowUpEmail({
        NJ_OPS_FOLLOWUP_EMAIL: 'elaine@ops.test',
        ELAINE_OPS_EMAIL: 'elaine-alt@ops.test',
        CONTACT_NOTIFICATIONS_EMAIL: 'hello@velocitymaid.com',
      })
    ).toBe('elaine@ops.test');

    expect(
      resolveNjOpsFollowUpEmail({
        ELAINE_OPS_EMAIL: 'elaine-alt@ops.test',
        CONTACT_NOTIFICATIONS_EMAIL: 'hello@velocitymaid.com',
      })
    ).toBe('elaine-alt@ops.test');

    expect(
      resolveNjOpsFollowUpEmail({
        CONTACT_NOTIFICATIONS_EMAIL: 'hello@velocitymaid.com',
      })
    ).toBe('hello@velocitymaid.com');

    expect(
      resolveNjLeadsCompanyEmail({
        NJ_LEADS_COMPANY_EMAIL: 'ops-copy@velocitymaid.com',
      })
    ).toBe('ops-copy@velocitymaid.com');

    expect(resolveNjLeadsCompanyEmail({})).toBe('hello@velocitymaid.com');
  });
});
