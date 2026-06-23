const OFFICES = [
  { name: 'Henderson', address: '26 Arkansas Ave, Henderson, Nevada 89015, United States' },
  { name: 'Palo Alto', address: '755 Page Mill Road, Suite A-200, Palo Alto, California 94304, USA' },
  { name: 'Signal Hill', address: '2799 Temple Avenue, Signal Hill, California 90755, United States' },
];

interface GeoResult {
  lat: number;
  lng: number;
}

interface DistanceResult {
  nearestOffice: string;
  distanceMiles: number;
  durationMinutes: number;
}

function getApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_MAPS_API_KEY env var');
  return key;
}

/**
 * Geocode an address to lat/lng
 */
export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const key = getApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    console.warn(`Geocoding failed for "${address}": ${data.status}`);
    return null;
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

/**
 * Get driving distance/time from all offices to a destination, return the closest
 */
export async function getClosestOffice(destinationAddress: string): Promise<DistanceResult | null> {
  const key = getApiKey();
  const origins = OFFICES.map(o => o.address).join('|');
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinationAddress)}&units=imperial&key=${key}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK') {
    console.warn(`Distance Matrix failed: ${data.status}`);
    return null;
  }

  let bestIdx = -1;
  let bestDuration = Infinity;

  for (let i = 0; i < data.rows.length; i++) {
    const el = data.rows[i].elements[0];
    if (el.status === 'OK' && el.duration.value < bestDuration) {
      bestDuration = el.duration.value;
      bestIdx = i;
    }
  }

  if (bestIdx === -1) return null;

  const best = data.rows[bestIdx].elements[0];
  return {
    nearestOffice: OFFICES[bestIdx].name,
    distanceMiles: Math.round((best.distance.value / 1609.34) * 10) / 10,
    durationMinutes: Math.round(best.duration.value / 60),
  };
}

export { OFFICES };

