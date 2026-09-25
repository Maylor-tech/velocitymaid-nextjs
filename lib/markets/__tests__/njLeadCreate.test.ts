import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const branchFindUnique = vi.fn();
const leadCreate = vi.fn();
const leadUpdate = vi.fn();
const customerFindFirst = vi.fn();
const notifyNjLeadFollowUp = vi.fn();
const calculateLeadScore = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    branch: { findUnique: (...a: unknown[]) => branchFindUnique(...a) },
    lead: {
      create: (...a: unknown[]) => leadCreate(...a),
      update: (...a: unknown[]) => leadUpdate(...a),
    },
    customer: { findFirst: (...a: unknown[]) => customerFindFirst(...a) },
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

describe('POST /api/leads/create NJ relaunch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ success: false }),
      })
    );
    calculateLeadScore.mockReturnValue({
      leadScore: 40,
      leadTier: 'C',
      riskFlags: [],
      reasoning: 'test',
    });
    branchFindUnique.mockResolvedValue({ id: 'branch-nj', slug: 'new-jersey' });
    customerFindFirst.mockResolvedValue(null);
    leadUpdate.mockResolvedValue({});
  });

  it('persists NJ lead with opsAssignee elaine even when ops email notify fails', async () => {
    leadCreate.mockResolvedValue({
      id: 'lead-1',
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
    });
    notifyNjLeadFollowUp.mockRejectedValue(new Error('resend down'));

    const res = await POST(leadRequest(njPayload));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.lead.opsAssignee).toBe('elaine');
    expect(body.lead.followUpStatus).toBe('NEW');
    expect(leadCreate).toHaveBeenCalled();
    const createData = leadCreate.mock.calls[0][0].data;
    expect(createData.opsAssignee).toBe('elaine');
    expect(createData.city).toBe('Montclair');
    expect(createData.serviceType).toBe('RECURRING');
    // Routing label only — no User lookup required for Elaine
    expect(createData).not.toHaveProperty('opsAssigneeId');
    expect(notifyNjLeadFollowUp).toHaveBeenCalled();
  });

  it('opsAssignee elaine is a string routing label (no User row required)', async () => {
    leadCreate.mockResolvedValue({
      id: 'lead-2',
      ...njPayload,
      preferredDate: new Date('2026-10-01'),
      followUpStatus: 'NEW',
      opsAssignee: 'elaine',
      status: 'NEW',
    });
    notifyNjLeadFollowUp.mockResolvedValue({
      sentToOps: false,
      sentToCompany: true,
    });

    const res = await POST(leadRequest(njPayload));
    expect(res.status).toBe(200);
    const createData = leadCreate.mock.calls[0][0].data;
    expect(createData.opsAssignee).toBe(NJ_OPS_ASSIGNEE);
    expect(typeof createData.opsAssignee).toBe('string');
  });

  it('non-NJ lead behavior remains unchanged (no elaine assignee, no NJ notify)', async () => {
    branchFindUnique.mockResolvedValue({ id: 'branch-vt', slug: 'vermont' });
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
