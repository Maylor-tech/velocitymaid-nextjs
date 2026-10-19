import { describe, expect, it } from 'vitest';
import { shouldHideWhatsAppWidget } from '@/lib/marketing/whatsappWidget';

describe('shouldHideWhatsAppWidget', () => {
  it('stays visible on marketing pages that are not recruitment', () => {
    expect(shouldHideWhatsAppWidget('/')).toBe(false);
    expect(shouldHideWhatsAppWidget('/vermont')).toBe(false);
    expect(shouldHideWhatsAppWidget('/hosts')).toBe(false);
  });

  it('hides the booking widget on Work with us so it cannot cover the video', () => {
    expect(shouldHideWhatsAppWidget('/vermont/work-with-us')).toBe(true);
    expect(shouldHideWhatsAppWidget('/jamaica/work-with-us')).toBe(true);
    expect(shouldHideWhatsAppWidget('/new-jersey/work-with-us')).toBe(true);
    expect(shouldHideWhatsAppWidget('/cleaners/apply')).toBe(true);
  });

  it('keeps the existing NJ market and admin hide rules', () => {
    expect(shouldHideWhatsAppWidget('/new-jersey')).toBe(true);
    expect(shouldHideWhatsAppWidget('/admin/jobs')).toBe(true);
    expect(shouldHideWhatsAppWidget(null)).toBe(false);
  });
});
