/**
 * Haversine Distance & Bounding Box Utilities
 * Blueprint Section 8:
 * Exact Haversine formula calculation for distance between two points on Earth (in km).
 */

const EARTH_RADIUS_KM = 6371.0;

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two points on Earth using Haversine formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers (rounded to 2 decimal places)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Pre-filter Bounding Box calculation for database spatial index speedup
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {{ minLat: number, maxLat: number, minLng: number, maxLng: number }}
 */
function getBoundingBox(lat, lng, radiusKm) {
  // 1 degree latitude ~ 111.0 km
  const deltaLat = radiusKm / 111.0;

  // 1 degree longitude ~ 111.0 km * cos(lat)
  const latRad = toRadians(lat);
  const cosLat = Math.cos(latRad);
  const deltaLng = cosLat > 0.0001 ? radiusKm / (111.0 * cosLat) : radiusKm / 111.0;

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: lng - deltaLng,
    maxLng: lng + deltaLng,
  };
}

module.exports = {
  EARTH_RADIUS_KM,
  calculateHaversineDistance,
  getBoundingBox,
};
