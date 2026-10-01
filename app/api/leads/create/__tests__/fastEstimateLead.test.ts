import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const branchFindUnique = vi.fn();
const leadFindFirst = vi.fn();
const leadCreate = vi.fn();
const leadUpdate = vi.fn();
const customerFindFirst = vi.fn();
const customerCreate = vi.fn();
const jobCreate = vi.fn();
const calculateLeadScore = vi.fn();
const notifyNjLeadFollowUp = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    branch: { findUnique: (...a: unknown[]) => branchFindUnique(...a) },
    lead: {
      findFirst: (...a: unknown[]) => leadFindFirst(...a),
      create: (...a: unknown[]) => leadCreate(...a),
      update: (...a: unknown[]) => leadUpdate(...a),
    },
    customer: {
      findFirst: (...a: unknown[]) => customerFindFirst(...a),
      create: (...a: unknown[]) => customerCreate(...a),
    },
    // Present so an accidental Job write would be observable (it must not happen).
    job: { create: (...a: unknown[]) => jobCreate(...a) },
  },
}));

vi.mock('@/lib/leadScoring', () => ({
  calculateLeadScore: (...a: unknown[]) => calculateLeadScore(...a),
}));

vi.mock('@/lib/markets/notifyNjLeadFollowUp', () => ({
  notifyNjLeadFollowUp: (...a: unknown[]) => notifyNjLeadFollowUp(...a),
}));

import { POST } from '@/app/api/leads/create/route';

function leadRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/leads/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const estimateLead = {
  name: 'Ballpark Betty',
  phone: '8025550123',
  email: 'betty@example.com',
  zip: '05753',
  bedrooms: 3,
  bathrooms: 2,
  pets: false,
  urgency: 'THIS_WEEK',
  serviceType: 'DEEP_CLEAN',
  preferredDate: '2026-11-15',
  branch: 'vermont',
  source: 'fast-estimate',
};

function fetchUrls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map((c) => String(c[0]));
}

describe('POST /api/leads/create — fast-estimate lead capture', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);
    branchFindUnique.mockResolvedValue({ id: 'branch-vt', slug: 'vermont' });
    calculateLeadScore.mockReturnValue({
      leadScore: 42,
      leadTier: 'C',
      riskFlags: [],
      reasoning: ['tier C'],
    });
    customerFindFirst.mockResolvedValue(null);
    leadUpdate.mockResolvedValue({});
    notifyNjLeadFollowUp.mockResolvedValue({});
  });

  it('captures the lead without ever creating a Job', async () => {
    leadFindFirst.mockResolvedValue(null);
    leadCreate.mockResolvedValue({
      id: 'lead-est-1',
      status: 'NEW',
      followUpStatus: 'NEW',
      opsAssignee: null,
      preferredDate: new Date('2026-11-15'),
    });

    const res = await POST(leadRequest(estimateLead));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(leadCreate).toHaveBeenCalledTimes(1);
    expect(jobCreate).not.toHaveBeenCalled();
    expect(body).not.toHaveProperty('jobId');
    expect(body.lead).not.toHaveProperty('jobId');
  });

  it('persists preferredDate with service-date semantics (not a guest stay date)', async () => {
    leadFindFirst.mockResolvedValue(null);
    leadCreate.mockResolvedValue({
      id: 'lead-est-2',
      status: 'NEW',
      followUpStatus: 'NEW',
      opsAssignee: null,
    });

    await POST(leadRequest(estimateLead));
    const createData = leadCreate.mock.calls[0][0].data;

    // The service/turnover date lands on Lead.preferredDate as a real Date.
    expect(createData.preferredDate).toBeInstanceOf(Date);
    expect((createData.preferredDate as Date).toISOString().slice(0, 10)).toBe(
      '2026-11-15'
    );
    // It must not be mapped onto any guest check-in / check-out stay field.
    expect(createData).not.toHaveProperty('guestCheckIn');
    expect(createData).not.toHaveProperty('guestCheckOut');
    expect(createData).not.toHaveProperty('checkInDate');
    expect(createData).not.toHaveProperty('checkOutDate');
  });

  it('dedupes a repeat fast-estimate: updates the existing lead, no new row, no re-fired automation', async () => {
    leadFindFirst.mockResolvedValue({
      id: 'lead-existing',
      email: 'old@example.com',
      zip: '05753',
      city: null,
      addressLine: null,
      bedrooms: 2,
      bathrooms: 1,
      serviceType: 'STANDARD',
      frequency: null,
      preferredDate: null,
      status: 'NEW',
      followUpStatus: 'NEW',
      opsAssignee: null,
      depositUrl: null,
    });
    leadUpdate.mockResolvedValue({
      id: 'lead-existing',
      status: 'NEW',
      followUpStatus: 'NEW',
      opsAssignee: null,
      depositUrl: null,
    });

    const res = await POST(leadRequest(estimateLead));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.deduped).toBe(true);
    expect(body.lead.id).toBe('lead-existing');
    expect(leadCreate).not.toHaveBeenCalled();
    expect(leadUpdate).toHaveBeenCalledTimes(1);
    expect(jobCreate).not.toHaveBeenCalled();

    // No duplicate deposit/WhatsApp/nurture automation on refresh.
    const urls = fetchUrls(fetchMock);
    expect(urls.some((u) => u.includes('/api/leads/deposit/generate'))).toBe(false);
    expect(urls.some((u) => u.includes('/api/automations/whatsapp/lead'))).toBe(false);
    expect(urls.some((u) => u.includes('/api/automations/nurture/scheduler'))).toBe(false);
  });

  it('dedupe lookup is scoped to the fast-estimate source only', async () => {
    leadFindFirst.mockResolvedValue(null);
    leadCreate.mockResolvedValue({
      id: 'lead-est-3',
      status: 'NEW',
      followUpStatus: 'NEW',
      opsAssignee: null,
    });

    await POST(leadRequest(estimateLead));
    expect(leadFindFirst).toHaveBeenCalledTimes(1);
    const where = leadFindFirst.mock.calls[0][0].where;
    expect(where.source).toBe('fast-estimate');
    expect(where.branchId).toBe('branch-vt');
    expect(where.phone).toBe(estimateLead.phone);
  });
});
