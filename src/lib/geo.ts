/**
 * GEO UTILITIES
 * 
 * Geolocation helpers for visit check-in and proximity validation
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Get current user position
 * @returns Promise with current coordinates
 */
export async function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Map GeolocationPositionError to readable error
        let message = 'Could not get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable. Please check your device settings and try again.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param a First coordinate
 * @param b Second coordinate
 * @returns Distance in meters
 */
export function haversineDistanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const a_calc =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a_calc), Math.sqrt(1 - a_calc));

  return R * c;
}

/**
 * Check if user is within specified radius of target location
 * @param userLocation User's current location
 * @param targetLocation Target location (dealer)
 * @param radiusMeters Allowed radius in meters (default: 200)
 * @returns Object with withinRadius boolean and distance in meters
 */
export function withinRadiusMeters(
  userLocation: Coordinates,
  targetLocation: Coordinates,
  radiusMeters: number = 200
): { withinRadius: boolean; distanceMeters: number } {
  const distance = haversineDistanceMeters(userLocation, targetLocation);
  return {
    withinRadius: distance <= radiusMeters,
    distanceMeters: distance,
  };
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "150m", "1.2km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(coords: Coordinates | null | undefined): coords is Coordinates {
  return (
    coords !== null &&
    coords !== undefined &&
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lng) &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
}
