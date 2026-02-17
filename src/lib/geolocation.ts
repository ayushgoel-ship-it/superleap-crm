/**
 * Calculate distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string like "45m" or "1.2km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Check if user is within geofence radius
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param targetLat Target location latitude
 * @param targetLon Target location longitude
 * @param radiusMeters Geofence radius in meters
 * @returns true if within radius
 */
export function isWithinGeofence(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusMeters;
}

/**
 * Get geofence status based on distance
 * @param distanceMeters Distance in meters
 * @returns 'inside' if within 200m, 'far' otherwise
 */
export function getGeofenceStatus(distanceMeters: number): 'inside' | 'far' {
  if (distanceMeters <= 200) return 'inside';
  return 'far';
}