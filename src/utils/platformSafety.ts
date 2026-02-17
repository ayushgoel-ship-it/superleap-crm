/**
 * PLATFORM SAFETY UTILITIES
 * 
 * Safe wrappers for Android intents, permissions, and external links.
 * Prevents crashes from missing permissions or unsupported features.
 */

import { ENV, logger } from '../config/env';
import { toast } from 'sonner@2.0.3';

/**
 * Check if running in mobile browser/app
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android/i.test(navigator.userAgent);
}

/**
 * Safe phone call intent
 */
export function safeCallPhone(phoneNumber: string): boolean {
  if (!ENV.ENABLE_CALL_INTENTS) {
    logger.warn('Call intents disabled in environment');
    toast.error('Calling is not available in this environment');
    return false;
  }
  
  try {
    // Clean phone number
    const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
    
    if (!cleaned) {
      toast.error('Invalid phone number');
      return false;
    }
    
    // Create tel: link
    const telLink = `tel:${cleaned}`;
    
    logger.info('Initiating call', { phoneNumber: cleaned });
    
    // Try to open
    window.location.href = telLink;
    
    return true;
  } catch (error) {
    logger.error('Failed to initiate call', error);
    toast.error('Could not open phone dialer');
    return false;
  }
}

/**
 * Safe WhatsApp deep link
 */
export function safeOpenWhatsApp(phoneNumber: string, message?: string): boolean {
  if (!ENV.ENABLE_WHATSAPP_DEEP_LINKS) {
    logger.warn('WhatsApp deep links disabled in environment');
    toast.error('WhatsApp is not available in this environment');
    return false;
  }
  
  try {
    // Clean phone number (remove + and spaces)
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    
    if (!cleaned) {
      toast.error('Invalid phone number');
      return false;
    }
    
    // Build WhatsApp URL
    let whatsappUrl = `https://wa.me/${cleaned}`;
    
    if (message) {
      const encodedMessage = encodeURIComponent(message);
      whatsappUrl += `?text=${encodedMessage}`;
    }
    
    logger.info('Opening WhatsApp', { phoneNumber: cleaned });
    
    // Open in new window (mobile will redirect to app)
    window.open(whatsappUrl, '_blank');
    
    return true;
  } catch (error) {
    logger.error('Failed to open WhatsApp', error);
    toast.error('Could not open WhatsApp');
    return false;
  }
}

/**
 * Safe Google Maps navigation
 */
export function safeOpenMaps(lat: number, lng: number, label?: string): boolean {
  if (!ENV.ENABLE_MAPS_INTEGRATION) {
    logger.warn('Maps integration disabled in environment');
    toast.error('Maps is not available in this environment');
    return false;
  }
  
  try {
    // Build maps URL
    let mapsUrl: string;
    
    if (isAndroid()) {
      // Android: use geo: scheme
      mapsUrl = `geo:${lat},${lng}?q=${lat},${lng}`;
      if (label) {
        mapsUrl += `(${encodeURIComponent(label)})`;
      }
    } else {
      // iOS and web: use Google Maps URL
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      if (label) {
        mapsUrl += `&query_place_id=${encodeURIComponent(label)}`;
      }
    }
    
    logger.info('Opening maps', { lat, lng, label });
    
    window.open(mapsUrl, '_blank');
    
    return true;
  } catch (error) {
    logger.error('Failed to open maps', error);
    toast.error('Could not open maps');
    return false;
  }
}

/**
 * Safe external link
 */
export function safeOpenExternalLink(url: string): boolean {
  try {
    // Validate URL
    new URL(url); // Throws if invalid
    
    logger.info('Opening external link', { url });
    
    window.open(url, '_blank', 'noopener,noreferrer');
    
    return true;
  } catch (error) {
    logger.error('Failed to open external link', error);
    toast.error('Invalid link');
    return false;
  }
}

/**
 * Request geolocation permission
 */
export async function requestLocationPermission(): Promise<GeolocationPosition | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    toast.error('Location services not available');
    return null;
  }
  
  try {
    logger.info('Requesting location permission');
    
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
    
    logger.info('Location permission granted', {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    });
    
    return position;
  } catch (error) {
    logger.error('Location permission denied or failed', error);
    
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error('Location permission denied. Please enable location access in settings.');
          break;
        case error.POSITION_UNAVAILABLE:
          toast.error('Location information unavailable. Please try again.');
          break;
        case error.TIMEOUT:
          toast.error('Location request timed out. Please try again.');
          break;
        default:
          toast.error('Could not get your location.');
      }
    } else {
      toast.error('Could not get your location.');
    }
    
    return null;
  }
}

/**
 * Get mock location (dev only)
 */
export function getMockLocation(): GeolocationPosition | null {
  if (!ENV.ENABLE_MOCK_LOCATION) {
    return null;
  }
  
  // Mock location: CARS24 HQ, Gurugram
  return {
    coords: {
      latitude: 28.4595,
      longitude: 77.0266,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  } as GeolocationPosition;
}

/**
 * Safe location request with fallback
 */
export async function safeGetLocation(): Promise<GeolocationPosition | null> {
  // Try real location first
  const position = await requestLocationPermission();
  
  if (position) {
    return position;
  }
  
  // Fallback to mock in dev
  if (ENV.IS_DEV) {
    logger.warn('Using mock location (dev mode)');
    return getMockLocation();
  }
  
  return null;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

/**
 * Check if user is within geofence
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number = ENV.GEOFENCE_RADIUS_METERS
): boolean {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  return distance <= radiusMeters;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Copy to clipboard (safe)
 */
export async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('Copied to clipboard');
        return true;
      }
      
      throw new Error('execCommand failed');
    }
  } catch (error) {
    logger.error('Failed to copy to clipboard', error);
    toast.error('Could not copy to clipboard');
    return false;
  }
}

/**
 * Share data (mobile share API)
 */
export async function safeShare(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return true;
    } else {
      // Fallback: copy to clipboard
      const textToShare = [data.title, data.text, data.url]
        .filter(Boolean)
        .join('\n');
      
      return await safeCopyToClipboard(textToShare);
    }
  } catch (error) {
    // User cancelled share or error occurred
    logger.debug('Share cancelled or failed', error);
    return false;
  }
}