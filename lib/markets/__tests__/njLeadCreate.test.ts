import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const branchFindUnique = vi.fn();
const leadCreate = vi.fn();
const leadUpdate = vi.fn();
const customerFindFirst = vi.fn();
const customerCreate = vi.fn();
const notifyNjLeadFollowUp = vi.fn();
const calculateLeadScore = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    branch: { findUnique: (...a: unknown[]) => branchFindUnique(...a) },
    lead: {
      create: (...a: unknown[]) => leadCreate(...a),
      update: (...a: unknown[]) => leadUpdate(...a),
    },
    customer: {
      findFirst: (...a: unknown[]) => customerFindFirst(...a),
      create: (...a: unknown[]) => customerCreate(...a),
    },
  },
}));

vi.mock('@/lib/leadScoring', () => ({
  calculateLeadScore: (...a: unknown[]) => calculateLeadScore(...a),
}));

vi.mock('@/lib/markets/notifyNjLeadFollowUp', () => ({
  notifyNjLeadFollowUp: (...a: unknown[]) => notifyNjLeadFollowUp(...a),
}));

import { POST } from '@/app/api/leads/create/route';
import { NJ_OPS_ASSIGNEE } from '@/lib/markets/newJersey';

function leadRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/leads/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const njPayload = {
  name: 'Test Host',
  phone: '9735550100',
  email: 'host@example.com',
  zip: '07042',
  city: 'Montclair',
  addressLine: '10 Church St',
  bedrooms: 3,
  bathrooms: 2,
  urgency: 'this_week',
  homeType: 'house',
  serviceType: 'RECURRING',
  frequency: 'biweekly',
  preferredDate: '2026-10-01',
  referralSource: 'website',
  source: 'lead-new-jersey-page',
  branch: 'new-jersey',
};

function mockNjLead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-nj',
    name: njPayload.name,
    phone: njPayload.phone,
    email: njPayload.email,
    city: njPayload.city,
    zip: njPayload.zip,
    addressLine: njPayload.addressLine,
    serviceType: njPayload.serviceType,
    frequency: njPayload.frequency,
    preferredDate: new Date('2026-10-01'),
    bedrooms: 3,
    bathrooms: 2,
    homeType: 'house',
    referralSource: 'website',
    source: 'lead-new-jersey-page',
    followUpStatus: 'NEW',
    opsAssignee: NJ_OPS_ASSIGNEE,
    status: 'NEW',
    ...overrides,
  };
}

function automationFetches(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map((call) => String(call[0]));
}

describe('POST /api/leads/create NJ quote-first isolation', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, depositUrl: 'https://example.com/deposit' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    branchFindUnique.mockResolvedValue({ id: 'branch-nj', slug: 'new-jersey' });
    customerFindFirst.mockResolvedValue(null);
    customerCreate.mockResolvedValue({ id: 'cust-should-not-exist' });
    leadUpdate.mockResolvedValue({});
    notifyNjLeadFollowUp.mockResolvedValue({
      sentToOps: true,
      sentToCompany: true,
    });
  });

  async function postNjWithTier(tier: 'A' | 'B' | 'C', score: number) {
    calculateLeadScore.mockReturnValue({
      leadScore: score,
      leadTier: tier,
      riskFlags: [],
      reasoning: [`tier ${tier}`],
    });
    leadCreate.mockResolvedValue(mockNjLead({ id: `lead-${tier}` }));
    return POST(leadRequest(njPayload));
  }

  it.each([
    { tier: 'A' as const, score: 90 },
    { tier: 'B' as const, score: 65 },
    { tier: 'C' as const, score: 40 },
  ])(
    'NJ Tier $tier → Lead only; no Customer, deposit, WhatsApp, or nurture',
    async ({ tier, score }) => {
      const res = await postNjWithTier(tier, score);
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.lead.followUpStatus).toBe('NEW');
      expect(body.lead.opsAssignee).toBe('elaine');
      expect(body.lead.leadTier).toBe(tier);
      expect(body.lead.leadScore).toBe(score);
      expect(body.lead.depositUrl).toBeNull();
      expect(body.scoring.tier).toBe(tier);

      const createData = leadCreate.mock.calls[0][0].data;
      expect(createData.followUpStatus).toBe('NEW');
      expect(createData.opsAssignee).toBe(NJ_OPS_ASSIGNEE);
      expect(createData.leadTier).toBe(tier);
      expect(createData.leadScore).toBe(score);

      expect(customerFindFirst).not.toHaveBeenCalled();
      expect(customerCreate).not.toHaveBeenCalled();
      expect(leadUpdate).not.toHaveBeenCalled();

      const urls = automationFetches(fetchMock);
      expect(urls.some((u) => u.includes('/api/leads/deposit/generate'))).toBe(
        false
      );
      expect(
        urls.some((u) => u.includes('/api/automations/whatsapp/lead'))
      ).toBe(false);
      expect(
        urls.some((u) => u.includes('/api/automations/nurture/scheduler'))
      ).toBe(false);

      expect(notifyNjLeadFollowUp).toHaveBeenCalledTimes(1);
    }
  );

  it('NJ ops/company/admin notifications still execute (notifyNjLeadFollowUp)', async () => {
    await postNjWithTier('A', 88);
    expect(notifyNjLeadFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 'lead-A',
        city: 'Montclair',
        followUpStatus: 'NEW',
        serviceType: 'RECURRING',
      })
    );
  });

  it('notification failure does not roll back the persisted Lead', async () => {
    calculateLeadScore.mockReturnValue({
      leadScore: 90,
      leadTier: 'A',
      riskFlags: [],
      reasoning: [],
    });
    leadCreate.mockResolvedValue(mockNjLead({ id: 'lead-notify-fail' }));
    notifyNjLeadFollowUp.mockRejectedValue(new Error('resend down'));

    const res = await POST(leadRequest(njPayload));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.lead.opsAssignee).toBe('elaine');
    expect(leadCreate).toHaveBeenCalled();
    expect(customerCreate).not.toHaveBeenCalled();
  });

  it('opsAssignee elaine is a string routing label (no User row required)', async () => {
    await postNjWithTier('B', 55);
    const createData = leadCreate.mock.calls[0][0].data;
    expect(createData.opsAssignee).toBe(NJ_OPS_ASSIGNEE);
    expect(typeof createData.opsAssignee).toBe('string');
    expect(createData).not.toHaveProperty('opsAssigneeId');
  });
});

describe('POST /api/leads/create non-NJ automation preserved', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes('/api/leads/deposit/generate')) {
        return {
          json: async () => ({
            success: true,
            depositUrl: 'https://example.com/deposit/vt',
          }),
        };
      }
      return { json: async () => ({ success: true }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    notifyNjLeadFollowUp.mockResolvedValue({
      sentToOps: false,
      sentToCompany: false,
    });
    leadUpdate.mockResolvedValue({});
  });

  it('non-NJ Tier C still generates deposit URL and calls WhatsApp', async () => {
    branchFindUnique.mockResolvedValue({ id: 'branch-vt', slug: 'vermont' });
    calculateLeadScore.mockReturnValue({
      leadScore: 35,
      leadTier: 'C',
      riskFlags: [],
      reasoning: [],
    });
    leadCreate.mockResolvedValue({
      id: 'lead-vt-c',
      name: 'VT Lead',
      phone: '8025550100',
      email: null,
      city: null,
      zip: '05149',
      addressLine: null,
      serviceType: null,
      frequency: null,
      preferredDate: null,
      bedrooms: null,
      bathrooms: null,
      homeType: null,
      referralSource: null,
      source: null,
      followUpStatus: 'NEW',
      opsAssignee: null,
      status: 'NEW',
    });

    const res = await POST(
      leadRequest({
        name: 'VT Lead',
        phone: '8025550100',
        zip: '05149',
        urgency: 'flexible',
        branch: 'vermont',
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lead.depositUrl).toBe('https://example.com/deposit/vt');
    expect(body.lead.opsAssignee).toBeNull();
    expect(notifyNjLeadFollowUp).not.toHaveBeenCalled();
    expect(customerCreate).not.toHaveBeenCalled();

    const urls = automationFetches(fetchMock);
    expect(urls.some((u) => u.includes('/api/leads/deposit/generate'))).toBe(
      true
    );
    expect(urls.some((u) => u.includes('/api/automations/whatsapp/lead'))).toBe(
      true
    );
  });

  it.each([
    { tier: 'A' as const, score: 85 },
    { tier: 'B' as const, score: 60 },
  ])(
    'non-NJ Tier $tier still creates Customer and starts nurture',
    async ({ tier, score }) => {
      branchFindUnique.mockResolvedValue({ id: 'branch-vt', slug: 'vermont' });
      calculateLeadScore.mockReturnValue({
        leadScore: score,
        leadTier: tier,
        riskFlags: [],
        reasoning: [],
      });
      leadCreate.mockResolvedValue({
        id: `lead-vt-${tier}`,
        name: 'VT Host',
        phone: '8025550199',
        email: 'vt@example.com',
        city: null,
        zip: '05149',
        addressLine: null,
        serviceType: null,
        frequency: null,
        preferredDate: null,
        bedrooms: 3,
        bathrooms: 2,
        homeType: 'house',
        referralSource: 'google',
        source: null,
        followUpStatus: 'NEW',
        opsAssignee: null,
        status: 'NEW',
      });
      customerFindFirst.mockResolvedValue(null);
      customerCreate.mockResolvedValue({ id: `cust-vt-${tier}` });

      const res = await POST(
        leadRequest({
          name: 'VT Host',
          phone: '8025550199',
          email: 'vt@example.com',
          zip: '05149',
          urgency: 'this_week',
          bedrooms: 3,
          bathrooms: 2,
          homeType: 'house',
          referralSource: 'google',
          branch: 'vermont',
        })
      );
      expect(res.status).toBe(200);
      expect(notifyNjLeadFollowUp).not.toHaveBeenCalled();
      expect(customerCreate).toHaveBeenCalled();
      expect(leadUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { customerId: `cust-vt-${tier}` },
        })
      );

      const urls = automationFetches(fetchMock);
      expect(
        urls.some((u) => u.includes('/api/automations/nurture/scheduler'))
      ).toBe(true);
      expect(
        urls.some((u) => u.includes('/api/automations/whatsapp/lead'))
      ).toBe(true);
      expect(urls.some((u) => u.includes('/api/leads/deposit/generate'))).toBe(
        false
      );
    }
  );

  it('non-NJ lead does not get elaine assignee or NJ notify', async () => {
    branchFindUnique.mockResolvedValue({ id: 'branch-vt', slug: 'vermont' });
    calculateLeadScore.mockReturnValue({
      leadScore: 40,
      leadTier: 'C',
      riskFlags: [],
      reasoning: [],
    });
    leadCreate.mockResolvedValue({
      id: 'lead-vt',
      name: 'VT Lead',
      phone: '8025550100',
      email: null,
      city: null,
      zip: '05149',
      addressLine: null,
      serviceType: null,
      frequency: null,
      preferredDate: null,
      bedrooms: null,
      bathrooms: null,
      homeType: null,
      referralSource: null,
      source: null,
      followUpStatus: 'NEW',
      opsAssignee: null,
      status: 'NEW',
    });

    const res = await POST(
      leadRequest({
        name: 'VT Lead',
        phone: '8025550100',
        zip: '05149',
        urgency: 'flexible',
        branch: 'vermont',
      })
    );
    expect(res.status).toBe(200);
    const createData = leadCreate.mock.calls[0][0].data;
    expect(createData.opsAssignee).toBeNull();
    expect(createData.city).toBeNull();
    expect(notifyNjLeadFollowUp).not.toHaveBeenCalled();
  });
});
