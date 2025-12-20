/**
 * City Routing Utilities
 * 
 * Maps ZIP codes to NJ sub-cities and handles city-specific routing
 */

// ZIP to City Mapping for New Jersey
const ZIP_TO_CITY: Record<string, string> = {
  // Jersey City
  '07302': 'jersey-city',
  '07304': 'jersey-city',
  '07305': 'jersey-city',
  '07306': 'jersey-city',
  '07307': 'jersey-city',
  '07310': 'jersey-city',
  
  // Hoboken
  '07030': 'hoboken',
  
  // Union
  '07083': 'union',
  
  // Rahway
  '07065': 'rahway',
  
  // Elizabeth
  '07201': 'elizabeth',
  '07202': 'elizabeth',
  '07206': 'elizabeth',
  '07208': 'elizabeth',
  
  // Newark
  '07101': 'newark',
  '07102': 'newark',
  '07103': 'newark',
  '07104': 'newark',
  '07105': 'newark',
  '07106': 'newark',
  '07107': 'newark',
  '07108': 'newark',
  '07109': 'newark',
  '07110': 'newark',
  '07111': 'newark',
  '07112': 'newark',
  '07114': 'newark',
};

// City Display Names
export const CITY_DISPLAY_NAMES: Record<string, string> = {
  'jersey-city': 'Jersey City',
  'hoboken': 'Hoboken',
  'union': 'Union',
  'rahway': 'Rahway',
  'elizabeth': 'Elizabeth',
  'newark': 'Newark',
};

// City ZIP Lists (for service area display)
export const CITY_ZIPS: Record<string, string[]> = {
  'jersey-city': ['07302', '07304', '07305', '07306', '07307', '07310'],
  'hoboken': ['07030'],
  'union': ['07083'],
  'rahway': ['07065'],
  'elizabeth': ['07201', '07202', '07206', '07208'],
  'newark': ['07101', '07102', '07103', '07104', '07105', '07106', '07107', '07108', '07109', '07110', '07111', '07112', '07114'],
};

/**
 * Resolve city from ZIP code
 */
export function resolveCityFromZip(zipCode: string): string | null {
  const normalizedZip = zipCode.trim();
  return ZIP_TO_CITY[normalizedZip] || null;
}

/**
 * Get all ZIPs for a city
 */
export function getZipsForCity(citySlug: string): string[] {
  return CITY_ZIPS[citySlug] || [];
}

/**
 * Check if ZIP belongs to a city
 */
export function isZipInCity(zipCode: string, citySlug: string): boolean {
  const zips = getZipsForCity(citySlug);
  return zips.includes(zipCode.trim());
}

/**
 * Get city display name
 */
export function getCityDisplayName(citySlug: string): string {
  return CITY_DISPLAY_NAMES[citySlug] || citySlug;
}

/**
 * Get all NJ sub-cities
 */
export function getAllNJCities(): string[] {
  return Object.keys(CITY_DISPLAY_NAMES);
}


