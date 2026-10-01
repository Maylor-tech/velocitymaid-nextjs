import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const calculateBookingQuoteAsync = vi.fn();

vi.mock('@/lib/pricing/calculateQuote', () => ({
  calculateBookingQuoteAsync: (...a: unknown[]) =>
    calculateBookingQuoteAsync(...a),
}));

import { POST } from '@/app/api/estimate/quick/route';
import {
  ESTIMATE_RANGE_LABEL,
  CUSTOM_QUOTE_LABEL,
} from '@/lib/estimate/fastEstimate';

function estimateRequest(body: Record<string, unknown>) {
  // No auth cookie/header is attached — the fast estimate is public.
  return new NextRequest('http://localhost/api/estimate/quick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const vtBody = {
  branchSlug: 'vermont',
  serviceType: 'DEEP_CLEAN',
  bedrooms: 3,
  bathrooms: 2,
};

describe('POST /api/estimate/quick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculateBookingQuoteAsync.mockResolvedValue({
      quote: {
        total: 300,
        currency: 'USD',
        estimatedHours: 4,
        recommendedCleaners: 2,
      },
      errors: [],
    });
  });

  it('is anonymous — returns an estimate range with no auth attached', async () => {
    const res = await POST(estimateRequest(vtBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.pricingVisible).toBe(true);
    expect(body.range.low).toBeGreaterThan(0);
    expect(body.range.high).toBeGreaterThan(body.range.low);
  });

  it('labels the result as an estimate — never a payable amount or invoice', async () => {
    const res = await POST(estimateRequest(vtBody));
    const body = await res.json();
    expect(body.isEstimate).toBe(true);
    expect(body.label).toBe(ESTIMATE_RANGE_LABEL);
    expect(body.range.label).toBe(ESTIMATE_RANGE_LABEL);
    // No payable / invoice fields leak through.
    expect(body).not.toHaveProperty('amountDue');
    expect(body).not.toHaveProperty('total');
    expect(body).not.toHaveProperty('depositUrl');
    expect(body).not.toHaveProperty('jobId');
    expect(body).not.toHaveProperty('invoiceId');
  });

  it('does not create a Job (estimate only — no booking side effects)', async () => {
    const res = await POST(estimateRequest(vtBody));
    const body = await res.json();
    // The handler never touches prisma; nothing bookable comes back.
    expect(body).not.toHaveProperty('job');
    expect(body).not.toHaveProperty('jobId');
    expect(body).not.toHaveProperty('booking');
  });

  it('hides dollar pricing for quote-first markets (New Jersey)', async () => {
    const res = await POST(estimateRequest({ ...vtBody, branchSlug: 'new-jersey' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.pricingVisible).toBe(false);
    expect(body.label).toBe(CUSTOM_QUOTE_LABEL);
    expect(body.range).toBeUndefined();
    // Pricing engine must not run for a hidden-pricing market.
    expect(calculateBookingQuoteAsync).not.toHaveBeenCalled();
  });

  it('fails safely on missing location (400, no price)', async () => {
    const res = await POST(estimateRequest({ serviceType: 'DEEP_CLEAN' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(calculateBookingQuoteAsync).not.toHaveBeenCalled();
  });

  it('fails safely when the quote engine returns errors', async () => {
    calculateBookingQuoteAsync.mockResolvedValue({
      quote: null,
      errors: ['Invalid service type'],
    });
    const res = await POST(estimateRequest(vtBody));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
