const EARTH_RADIUS_MILES = 3958.8;

/** Haversine distance in miles between two lat/lng points. */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** VelocityMaid HQ — Ludlow, VT (travel zone reference point). */
export const VM_HQ = {
  lat: 43.3956,
  lng: -72.7023,
  label: 'VelocityMaid HQ — Ludlow, VT',
} as const;

export const ZONE_RADIUS_MILES = [20, 40, 60] as const;
