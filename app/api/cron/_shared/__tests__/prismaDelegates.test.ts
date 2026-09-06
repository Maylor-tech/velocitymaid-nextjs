import { describe, expect, it } from 'vitest';
import {
  getCleanerTaxProfileDelegate,
  getWeeklyEmailLogDelegate,
} from '@/app/api/cron/_shared/prismaDelegates';

describe('missing Prisma delegates', () => {
  it('does not expose cleanerTaxProfile while the model is absent from schema', () => {
    expect(getCleanerTaxProfileDelegate()).toBeNull();
  });

  it('does not expose weeklyEmailLog while the model is absent from schema', () => {
    expect(getWeeklyEmailLogDelegate()).toBeNull();
  });
});
