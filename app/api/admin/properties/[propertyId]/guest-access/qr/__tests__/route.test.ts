/**
 * Admin stay QR download — auth + fail-closed (Phase 1D-B).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { stayPublicUrl } from '@/lib/stay/propertyGuestAccess';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  propertyFindUnique: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    property: {
      findUnique: (...a: unknown[]) => mocks.propertyFindUnique(...a),
    },
  },
}));

import { GET as adminQrGet } from '@/app/api/admin/properties/[propertyId]/guest-access/qr/route';

const TOKEN = 'opaqueStayTokenAabcdefghijklmnopqrstuvwxyz0123456789';
const STAY_URL = stayPublicUrl(TOKEN);

function decodePngQr(buffer: Buffer): string | null {
  const png = PNG.sync.read(buffer);
  const code = jsQR(
    new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength),
    png.width,
    png.height
  );
  return code?.data ?? null;
}

describe('Admin property guest-access QR API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.velocitymaid.com';
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
  });

  it('ADMIN route → allowed when qrReady', async () => {
    mocks.propertyFindUnique
      .mockResolvedValueOnce({ id: 'prop-1' })
      .mockResolvedValueOnce({
        guestAccessToken: TOKEN,
        guestAccessTokenCreatedAt: new Date('2026-09-01T00:00:00.000Z'),
        guestAccessRevokedAt: null,
        guestDisplayName: 'Birch Cabin',
        Customer: { archivedAt: null },
      });

    const res = await adminQrGet(
      new NextRequest(
        'http://localhost/api/admin/properties/prop-1/guest-access/qr?format=png'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(200);
    expect(mocks.requireRole).toHaveBeenCalledWith(
      expect.anything(),
      'ADMIN'
    );
    expect(res.headers.get('X-Robots-Tag')).toBe(
      'noindex, nofollow, noarchive'
    );
    const buf = Buffer.from(await res.arrayBuffer());
    expect(decodePngQr(buf)).toBe(STAY_URL);
  });

  it('ADMIN unauthorized → denied', async () => {
    mocks.requireRole.mockImplementation(async () => {
      throw NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    });
    const res = await adminQrGet(
      new NextRequest(
        'http://localhost/api/admin/properties/prop-1/guest-access/qr'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(401);
  });

  it('not qrReady → fail closed', async () => {
    mocks.propertyFindUnique
      .mockResolvedValueOnce({ id: 'prop-1' })
      .mockResolvedValueOnce({
        guestAccessToken: TOKEN,
        guestAccessTokenCreatedAt: new Date('2026-09-01T00:00:00.000Z'),
        guestAccessRevokedAt: null,
        guestDisplayName: null,
        Customer: { archivedAt: null },
      });

    const res = await adminQrGet(
      new NextRequest(
        'http://localhost/api/admin/properties/prop-1/guest-access/qr'
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(409);
  });
});
