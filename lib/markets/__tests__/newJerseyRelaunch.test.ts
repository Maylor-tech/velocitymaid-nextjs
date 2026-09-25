import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  NJ_LEAD_PATH,
  NJ_PRICING_PUBLIC_LABEL,
  NJ_PUBLIC_SERVICES,
  NJ_SERVICE_CITIES,
  njCitiesShortList,
} from '@/lib/markets/newJersey';
import { NJ_SERVICE_OPTIONS } from '@/lib/booking/markets';
import { getAllNJCities } from '@/utils/cityRouting';

describe('NJ market relaunch', () => {
  it('territory matches Elaine service cities', () => {
    expect([...NJ_SERVICE_CITIES]).toEqual([
      'Bloomfield',
      'Montclair',
      'Newark',
      'East Orange',
      'Irvington',
      'South Orange',
      'West Orange',
      'Nutley',
    ]);
    expect(njCitiesShortList()).toContain('Montclair');
    expect(njCitiesShortList()).not.toContain('Jersey City');
    expect(getAllNJCities()).toContain('montclair');
    expect(getAllNJCities()).not.toContain('jersey-city');
  });

  it('service hierarchy is recurring → deep → move → STR secondary', () => {
    expect(NJ_PUBLIC_SERVICES[0].key).toBe('recurring');
    expect(NJ_PUBLIC_SERVICES[0].featured).toBe(true);
    expect(NJ_PUBLIC_SERVICES.map((s) => s.key)).toEqual([
      'recurring',
      'deep',
      'move',
      'str',
    ]);
    expect(NJ_SERVICE_OPTIONS[0].value).toBe('RECURRING');
    expect(NJ_SERVICE_OPTIONS.map((s) => s.value)).not.toContain(
      'VACATION_RENTAL_TURNOVER'
    );
  });

  it('does not publish NJ dollar starting prices on marketing surfaces', () => {
    expect(NJ_PRICING_PUBLIC_LABEL).toBe('Custom quote');
    expect(NJ_LEAD_PATH).toBe('/lead/new-jersey');
    const marketing = readFileSync(
      join(process.cwd(), 'components/marketing/MarketingPageSections.tsx'),
      'utf8'
    );
    expect(marketing).not.toMatch(/\$120|\$220/);
    expect(marketing).toContain('Request a quote');
    const pricing = readFileSync(
      join(process.cwd(), 'components/PricingTiers.tsx'),
      'utf8'
    );
    expect(pricing).toContain('Custom quote');
    expect(pricing).not.toMatch(/price: "\$120"/);
  });
});
