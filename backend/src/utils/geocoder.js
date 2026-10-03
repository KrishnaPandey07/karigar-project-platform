/**
 * Nominatim Geocoding Client
 * Blueprint Section 9:
 * - Called ONLY when a vendor saves an address (write time)
 * - Cached to prevent redundant lookups
 * - User-Agent header is mandatory per OSM Nominatim Usage Policy
 * - Strictly rate-limited to 1 request per second
 * - NEVER called during search (searches use precomputed DB coordinates)
 */

const inMemoryGeoCache = new Map();
let lastRequestTimestamp = 0;

/**
 * Throttle requests to satisfy Nominatim's strict 1 req/sec policy
 */
async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTimestamp;
  if (timeSinceLast < 1000) {
    const waitMs = 1000 - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastRequestTimestamp = Date.now();
}

/**
 * Geocode an address string to { lat, lng, displayName }
 * @param {string} address
 * @returns {Promise<{ lat: number, lng: number, displayName: string } | null>}
 */
async function geocodeAddress(address) {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return null;
  }

  const normalized = address.trim().toLowerCase();

  // 1. Check in-memory cache
  if (inMemoryGeoCache.has(normalized)) {
    return inMemoryGeoCache.get(normalized);
  }

  try {
    await enforceRateLimit();

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address.trim());
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'LocalLink-Platform/1.0 (support@locallink.dev)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Nominatim geocoding failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    const first = data[0];
    const result = {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayName: first.display_name,
    };

    // Cache the result
    inMemoryGeoCache.set(normalized, result);
    return result;
  } catch (err) {
    console.error('Nominatim geocoder error:', err.message);
    return null;
  }
}

/**
 * Reverse geocode { lat, lng } to human-friendly address / locality details
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ displayName: string, city: string, state: string, postalCode: string } | null>}
 */
async function reverseGeocode(lat, lng) {
  if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
    return null;
  }
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (inMemoryGeoCache.has(key)) {
    return inMemoryGeoCache.get(key);
  }

  try {
    await enforceRateLimit();
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lng);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'LocalLink-Platform/1.0 (support@locallink.dev)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data) return null;

    const addr = data.address || {};
    const city = addr.city || addr.town || addr.suburb || addr.village || addr.county || addr.state_district || 'My Location';
    const result = {
      displayName: data.display_name || city,
      city,
      state: addr.state || '',
      postalCode: addr.postcode || '',
      lat,
      lng,
    };
    inMemoryGeoCache.set(key, result);
    return result;
  } catch (err) {
    console.error('Nominatim reverse geocoder error:', err.message);
    return null;
  }
}

module.exports = {
  geocodeAddress,
  reverseGeocode,
};

