import { describe, expect, it } from 'vitest';
import { whatsAppDeliveryStatus } from '@/lib/whatsapp/referralDelivery';

describe('WhatsApp delivery status mapping', () => {
  it('treats delivered and read as delivery confirmation', () => {
    expect(whatsAppDeliveryStatus('delivered')).toBe('delivery_confirmed');
    expect(whatsAppDeliveryStatus('read')).toBe('delivery_confirmed');
  });

  it('keeps provider acceptance separate from a failed delivery receipt', () => {
    expect(whatsAppDeliveryStatus('sent')).toBe('accepted');
    expect(whatsAppDeliveryStatus('failed')).toBe('failed');
    expect(whatsAppDeliveryStatus('queued')).toBeNull();
  });
});
