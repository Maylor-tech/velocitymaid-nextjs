export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export function getGoogleMapsApiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

/** Geocode an address via Google Maps Geocoding API (server-side). */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return null;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error('[geocode] HTTP error', res.status, address);
    return null;
  }

  const data = (await res.json()) as {
    status: string;
    results?: { geometry: { location: { lat: number; lng: number } } }[];
  };

  if (data.status !== 'OK' || !data.results?.[0]) {
    console.warn('[geocode] No result for address:', address, data.status);
    return null;
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
}
