/**
 * Phase 1D-B — Pilot stay QR download & fail-closed gates
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import { join } from 'path';

const mocks = vi.hoisted(() => ({
  getCustomerSession: vi.fn(),
  loadOwnedProperty: vi.fn(),
  propertyFindUnique: vi.fn(),
}));

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => mocks.getCustomerSession(...a),
}));

vi.mock('@/lib/properties/propertyService', () => ({
  loadOwnedProperty: (...a: unknown[]) => mocks.loadOwnedProperty(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    property: {
      findUnique: (...a: unknown[]) => mocks.propertyFindUnique(...a),
    },
  },
}));

import { GET as customerQrGet } from '@/app/api/customer/properties/[propertyId]/guest-access/qr/route';
import { GET as reviewsQrGet } from '@/app/api/reviews/qr-code/route';
import { GET as referralsQrGet } from '@/app/api/referrals/qr-code/route';
import { renderStayQr, STAY_QR_CACHE_HEADERS } from '@/lib/stay/stayQr';
import { stayPublicUrl } from '@/lib/stay/propertyGuestAccess';
import { STAY_CARD_COPY, STAY_CARD_VERSION } from '@/lib/stay/stayCardCopy';

const TOKEN_A = 'opaqueStayTokenAabcdefghijklmnopqrstuvwxyz0123456789';
const TOKEN_B = 'opaqueStayTokenBzyxwvutsrqponmlkjihgfedcba9876543210';
const STAY_URL_A = stayPublicUrl(TOKEN_A);
const STAY_URL_B = stayPublicUrl(TOKEN_B);

function decodePngQr(buffer: Buffer): string | null {
  const png = PNG.sync.read(buffer);
  const code = jsQR(
    new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength),
    png.width,
    png.height
  );
  return code?.data ?? null;
}

function readyPropertyRow(token: string, displayName = 'Birch Cabin') {
  return {
    guestAccessToken: token,
    guestAccessTokenCreatedAt: new Date('2026-09-01T00:00:00.000Z'),
    guestAccessRevokedAt: null,
    guestDisplayName: displayName,
    Customer: { archivedAt: null },
  };
}

describe('Phase 1D-B stay QR download', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.velocitymaid.com';
    mocks.getCustomerSession.mockResolvedValue({ customerId: 'cust-1' });
    mocks.loadOwnedProperty.mockResolvedValue({ id: 'prop-1' });
    mocks.propertyFindUnique.mockResolvedValue(readyPropertyRow(TOKEN_A));
  });

  it('CUSTOMER owned property + qrReady → QR 200 PNG', async () => {
    const res = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access/qr?format=png'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Content-Disposition')).toContain(
      'velocitymaid-stay-qr.png'
    );
    expect(res.headers.get('Cache-Control')).toBe(
      STAY_QR_CACHE_HEADERS['Cache-Control']
    );
    expect(res.headers.get('X-Robots-Tag')).toBe(
      STAY_QR_CACHE_HEADERS['X-Robots-Tag']
    );
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(decodePngQr(buf)).toBe(STAY_URL_A);
  });

  it('CUSTOMER owned property + qrReady → QR 200 SVG', async () => {
    const res = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access/qr?format=svg'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('image/svg+xml');
    expect(res.headers.get('Content-Disposition')).toContain(
      'velocitymaid-stay-qr.svg'
    );
    const svg = await res.text();
    expect(svg).toMatch(/<svg[\s>]/i);
    const expected = await QRCode.toString(STAY_URL_A, {
      type: 'svg',
      margin: 2,
      color: { dark: '#0B1F33', light: '#FFFFFF' },
      width: 512,
    });
    expect(svg).toBe(expected);
  });

  it('cross-customer → denied', async () => {
    mocks.loadOwnedProperty.mockResolvedValue(null);
    const res = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-other/guest-access/qr'
      ),
      { params: { propertyId: 'prop-other' } }
    );
    expect(res.status).toBe(404);
  });

  it('unauthenticated → denied', async () => {
    mocks.getCustomerSession.mockResolvedValue(null);
    const res = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access/qr'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(401);
    expect(mocks.loadOwnedProperty).not.toHaveBeenCalled();
  });

  it('not active → denied', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      ...readyPropertyRow(TOKEN_A),
      guestAccessRevokedAt: new Date('2026-09-10T00:00:00.000Z'),
    });
    const res = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access/qr'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('NOT_READY');
  });

  it('missing display name / qrReady false → denied', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      ...readyPropertyRow(TOKEN_A),
      guestDisplayName: '   ',
    });
    const res = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access/qr'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('NOT_READY');
  });

  it('rotate changes encoded stay URL', async () => {
    mocks.propertyFindUnique.mockResolvedValue(readyPropertyRow(TOKEN_A));
    const before = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access/qr?format=png'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    const beforeUrl = decodePngQr(Buffer.from(await before.arrayBuffer()));
    expect(beforeUrl).toBe(STAY_URL_A);

    mocks.propertyFindUnique.mockResolvedValue(readyPropertyRow(TOKEN_B));
    const after = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access/qr?format=png'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    const afterUrl = decodePngQr(Buffer.from(await after.arrayBuffer()));
    expect(afterUrl).toBe(STAY_URL_B);
    expect(afterUrl).not.toBe(beforeUrl);
  });

  it('revoke makes QR endpoint fail closed', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      guestAccessToken: null,
      guestAccessTokenCreatedAt: null,
      guestAccessRevokedAt: new Date('2026-09-15T00:00:00.000Z'),
      guestDisplayName: 'Birch Cabin',
      Customer: { archivedAt: null },
    });
    const res = await customerQrGet(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access/qr'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(409);
  });

  it('QR does not contain Job/property/customer identifiers or Google/referral URL', async () => {
    const png = await renderStayQr(STAY_URL_A, 'png');
    const svg = await renderStayQr(STAY_URL_A, 'svg');
    const decoded = decodePngQr(png.body as Buffer);
    expect(decoded).toBe(STAY_URL_A);

    const forbidden = [
      'prop-1',
      'cust-1',
      'job-',
      '/review-us/',
      'google.com',
      'g.page',
      '/referrals/',
      'referral',
      'street',
      'cleaner',
    ];
    for (const needle of forbidden) {
      expect(decoded!.toLowerCase()).not.toContain(needle.toLowerCase());
      expect((svg.body as string).toLowerCase()).not.toContain(
        needle.toLowerCase()
      );
    }
    expect(decoded).toMatch(/^https:\/\/www\.velocitymaid\.com\/stay\//);
    expect(decoded).not.toMatch(/jobId|propertyId|customerId/i);
  });

  it('existing review/referral QR behavior untouched', async () => {
    const review = await reviewsQrGet(
      new NextRequest('http://localhost/api/reviews/qr-code?branch=new-jersey')
    );
    expect(review.status).toBe(200);
    expect(review.headers.get('Content-Disposition')).toContain(
      'review-qr-nj.png'
    );
    const reviewDecoded = decodePngQr(Buffer.from(await review.arrayBuffer()));
    expect(reviewDecoded).toBe('https://velocitymaid.com/review-us/new-jersey');

    const referralSrc = readFileSync(
      join(process.cwd(), 'app/api/referrals/qr-code/route.ts'),
      'utf8'
    );
    expect(referralSrc).toContain('/api/referrals/qr-code');
    expect(referralSrc).toContain('bookingUrl');
    // Stay QR routes must not import review/referral generators
    const stayCustomer = readFileSync(
      join(
        process.cwd(),
        'app/api/customer/properties/[propertyId]/guest-access/qr/route.ts'
      ),
      'utf8'
    );
    const stayAdmin = readFileSync(
      join(
        process.cwd(),
        'app/api/admin/properties/[propertyId]/guest-access/qr/route.ts'
      ),
      'utf8'
    );
    expect(stayCustomer).not.toContain('reviews/qr-code');
    expect(stayCustomer).not.toContain('referrals/qr-code');
    expect(stayAdmin).not.toContain('reviews/qr-code');
    expect(stayAdmin).not.toContain('referrals/qr-code');
    expect(typeof referralsQrGet).toBe('function');
  });

  it('card copy brief preserves approved meaning', () => {
    expect(STAY_CARD_VERSION).toBe('VM-STAY-CARD-v1');
    expect(STAY_CARD_COPY.brand).toBe('VELOCITYMAID');
    expect(STAY_CARD_COPY.headline).toBe('How was your stay?');
    expect(STAY_CARD_COPY.googleReviewsNote.toLowerCase()).toContain('google');
    expect(STAY_CARD_COPY.tippingOptional.toLowerCase()).toContain('optional');
  });
});
