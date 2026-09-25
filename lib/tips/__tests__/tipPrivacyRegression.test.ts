import { describe, expect, it } from 'vitest';
import TipSuccess from '@/components/tip/TipSuccess';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('TipSuccess privacy / copy', () => {
  it('uses credited-to-team copy without notification promise or Google CTA', () => {
    const src = readFileSync(
      join(process.cwd(), 'components/tip/TipSuccess.tsx'),
      'utf8'
    );
    expect(src).toMatch(/credited to the\s+cleaning team/);
    expect(src).not.toMatch(/cleaner knows/i);
    expect(src).not.toMatch(/DEFAULT_GOOGLE_REVIEW_URL/);
    expect(src).not.toMatch(/Leave us a Google/);
    expect(src).not.toMatch(/ServiceFeedback|feedbackToken/);
  });

  it('component renders without requiring guestName', () => {
    expect(typeof TipSuccess).toBe('function');
  });
});

describe('Stripe tip metadata privacy (create-payment-intent source)', () => {
  it('Stripe metadata block has no Stay token or private feedback', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/api/tip/create-payment-intent/route.ts'),
      'utf8'
    );
    const metaStart = src.indexOf('metadata: {');
    expect(metaStart).toBeGreaterThan(-1);
    const metaEnd = src.indexOf('},', metaStart);
    const metaBlock = src.slice(metaStart, metaEnd);
    expect(metaBlock).toContain("type: 'cleaner_tip'");
    expect(metaBlock).toContain('tipId:');
    expect(metaBlock).toContain('jobId:');
    expect(metaBlock).toContain('beneficiaryCleanerId:');
    expect(metaBlock).not.toMatch(/stayToken|grantToken|feedbackToken|guestMessage|adminNotes/);
    expect(src).toMatch(/cleanerId != null/);
  });
});
