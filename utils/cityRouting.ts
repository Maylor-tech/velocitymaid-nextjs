/**
 * City Routing Utilities
 * Maps ZIP codes to NJ sub-cities (Elaine territory) for SEO city pages.
 */

import {
  NJ_CITY_DISPLAY_BY_SLUG,
  NJ_TERRITORY_ZIPS,
} from '@/lib/markets/newJersey';

const ZIP_TO_CITY: Record<string, string> = Object.fromEntries(
  NJ_TERRITORY_ZIPS.map((z) => [
    z.zip,
    z.city.toLowerCase().replace(/\s+/g, '-'),
  ])
);

export const CITY_DISPLAY_NAMES: Record<string, string> = {
  ...NJ_CITY_DISPLAY_BY_SLUG,
};

export const CITY_ZIP_CODES: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const row of NJ_TERRITORY_ZIPS) {
    const slug = row.city.toLowerCase().replace(/\s+/g, '-');
    if (!map[slug]) map[slug] = [];
    map[slug].push(row.zip);
  }
  return map;
})();

export function getCityFromZip(zip: string): string | null {
  return ZIP_TO_CITY[zip] || null;
}

/** Alias used by /api/resolve-zip (city slug only; branch resolution is separate). */
export function resolveCityFromZip(zip: string): string | null {
  return getCityFromZip(zip.trim());
}

export function getCityDisplayName(citySlug: string): string {
  return CITY_DISPLAY_NAMES[citySlug] || citySlug;
}

export function getZipsForCity(citySlug: string): string[] {
  return CITY_ZIP_CODES[citySlug] || [];
}

export function getAllNjCities(): string[] {
  return Object.keys(CITY_DISPLAY_NAMES);
}

/** Legacy alias */
export function getAllNJCities(): string[] {
  return getAllNjCities();
}

export function isValidNjCity(citySlug: string): boolean {
  return citySlug in CITY_DISPLAY_NAMES;
}
