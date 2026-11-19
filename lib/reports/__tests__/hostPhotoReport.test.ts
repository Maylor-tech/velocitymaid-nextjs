import { describe, expect, it } from 'vitest';
import { buildHostPhotoReport, cleanerFirstName } from '@/lib/reports/hostPhotoReport';
import {
  missingHostPaymentDetails,
  readHostPaymentConfig,
} from '@/lib/reports/hostPaymentOptions';

const slots = [
  { key: 'kitchen', label: 'Kitchen', sortOrder: 10 },
  { key: 'living', label: 'Living', sortOrder: 60 },
];

const base = {
  propertyName: 'Staging Walk Cabin',
  serviceDate: '2026-11-18T00:00:00.000Z',
  finishedAt: '2026-11-18T22:55:00.000Z',
  cleanerName: 'Alex Rivera',
  slots,
  photos: [
    {
      id: 'after-kitchen',
      url: 'https://example.test/kitchen-after.jpg',
      category: 'AFTER',
      slotKey: 'kitchen',
      customerVisible: true,
      caption: null,
    },
    {
      id: 'before-kitchen',
      url: 'https://example.test/kitchen-before.jpg',
      category: 'BEFORE',
      slotKey: 'kitchen',
      customerVisible: true,
      caption: null,
    },
    {
      id: 'hidden-living',
      url: 'https://example.test/living-hidden.jpg',
      category: 'AFTER',
      slotKey: 'living',
      customerVisible: false,
      caption: null,
    },
    {
      id: 'damage-photo',
      url: 'https://example.test/lamp.jpg',
      category: 'DAMAGE',
      slotKey: 'living',
      customerVisible: true,
      caption: 'Cracked lamp shade, living room',
    },
  ],
  flags: [
    {
      id: 'flag-damage',
      kind: 'DAMAGE',
      note: 'Cracked lamp shade, living room',
      photoId: 'damage-photo',
    },
    {
      id: 'flag-supply',
      kind: 'SUPPLY',
      note: 'Paper towels',
      photoId: null,
    },
  ],
  invoice: {
    total: 390,
    balanceDue: 390,
    publicToken: 'inv_public_token_00000001',
    status: 'SENT',
  },
  paymentConfig: {
    zelleHandle: 'pay@velocitymaid.test',
    paypalUrl: 'https://paypal.me/velocitymaid',
    cardEnabled: true,
  },
};

describe('host photo report', () => {
  it('keeps the cleaner to a first name and hides non-visible photos', () => {
    expect(cleanerFirstName('Alex Rivera')).toBe('Alex');
    expect(cleanerFirstName('pay@velocitymaid.test')).toBeNull();
    const report = buildHostPhotoReport(base);
    expect(report.propertyName).toBe('Staging Walk Cabin');
    expect(report.serviceDateLabel).toBe('November 18, 2026');
    expect(report.finishedLabel).toBe('Turnover complete · 5:55 PM');
    expect(report.cleanerFirstName).toBe('Alex');
    expect(report.rooms[0]?.after.map((photo) => photo.url)).toEqual([
      'https://example.test/kitchen-after.jpg',
    ]);
    expect(report.rooms[0]?.before).toHaveLength(1);
    expect(report.before).toEqual([]);
    expect(report.rooms[1]?.after).toEqual([]);
    const leaked = JSON.stringify(report);
    expect(leaked).not.toMatch(/reviewStatus|compensation|overrideReason|internalNotes|inspection/i);
    expect(report).not.toHaveProperty('cleanerEmail');
    expect(report).not.toHaveProperty('cleanerPhone');
  });

  it('lists each notice with its photo, and supplies as a short list', () => {
    const report = buildHostPhotoReport(base);
    expect(report.notices).toEqual([
      {
        id: 'flag-damage',
        note: 'Cracked lamp shade, living room',
        photo: {
          url: 'https://example.test/lamp.jpg',
          alt: 'Cracked lamp shade, living room',
        },
      },
    ]);
    expect(report.supplies).toEqual(['Paper towels']);
  });

  it('says nothing to report when there are no notice flags', () => {
    const report = buildHostPhotoReport({
      ...base,
      flags: [base.flags[1]!],
      photos: base.photos.filter((photo) => photo.id !== 'damage-photo'),
    });
    expect(report.notices).toEqual([]);
    expect(report.supplies).toEqual(['Paper towels']);
  });

  it('shows a before photo that was not tied to a room', () => {
    const report = buildHostPhotoReport({
      ...base,
      photos: [
        ...base.photos,
        {
          id: 'before-open',
          url: 'https://example.test/before.jpg',
          category: 'BEFORE',
          slotKey: null,
          customerVisible: true,
          caption: null,
        },
      ],
    });
    expect(report.before).toEqual([{ url: 'https://example.test/before.jpg', alt: 'Before' }]);
    expect(
      report.rooms.every((room) =>
        room.before.every((photo) => photo.url !== 'https://example.test/before.jpg')
      )
    ).toBe(true);
  });

  it('drops a notice photo that is not customer visible', () => {
    const report = buildHostPhotoReport({
      ...base,
      photos: base.photos.map((photo) =>
        photo.id === 'damage-photo' ? { ...photo, customerVisible: false } : photo
      ),
    });
    expect(report.notices[0]?.note).toBe('Cracked lamp shade, living room');
    expect(report.notices[0]?.photo).toBeNull();
  });

  it('shows the invoice amount and only configured payment options', () => {
    const report = buildHostPhotoReport(base);
    expect(report.payment).toEqual({
      amount: '$390.00',
      paid: false,
      zelleHandle: 'pay@velocitymaid.test',
      paypalUrl: 'https://paypal.me/velocitymaid',
      cardToken: 'inv_public_token_00000001',
    });
    const hidden = buildHostPhotoReport({
      ...base,
      paymentConfig: { zelleHandle: null, paypalUrl: null, cardEnabled: false },
    });
    expect(hidden.payment).toMatchObject({
      amount: '$390.00',
      zelleHandle: null,
      paypalUrl: null,
      cardToken: null,
    });
    expect(hidden.payment && JSON.stringify(hidden.payment)).not.toMatch(
      /surcharge|discount|ACH/i
    );
  });

  it('omits payment when there is no invoice', () => {
    expect(buildHostPhotoReport({ ...base, invoice: null }).payment).toBeNull();
  });
});

describe('host payment config', () => {
  it('does not invent a Zelle recipient or PayPal link', () => {
    const config = readHostPaymentConfig({
      PAYPAL_EMAIL: 'hello@velocitymaid.com',
    });
    expect(config.zelleHandle).toBeNull();
    expect(config.paypalUrl).toBeNull();
    expect(config.cardEnabled).toBe(false);
    expect(missingHostPaymentDetails(config)).toEqual([
      'Zelle recipient (VELOCITYMAID_ZELLE_HANDLE or ZELLE_HANDLE)',
      'PayPal link (PAYPAL_ME_URL)',
      'Card checkout (STRIPE_SECRET_KEY)',
    ]);
  });

  it('reads a configured handle, https PayPal link, and card switch', () => {
    const config = readHostPaymentConfig({
      ZELLE_HANDLE: ' pay@velocitymaid.test ',
      PAYPAL_ME_URL: 'https://paypal.me/velocitymaid',
      STRIPE_SECRET_KEY: 'sk_test_present',
    });
    expect(config).toEqual({
      zelleHandle: 'pay@velocitymaid.test',
      paypalUrl: 'https://paypal.me/velocitymaid',
      cardEnabled: true,
    });
  });
});
