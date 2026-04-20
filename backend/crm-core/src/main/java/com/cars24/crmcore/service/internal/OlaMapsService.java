package com.cars24.crmcore.service.internal;

import java.util.List;
import java.util.Map;

/**
 * Proxy service for Ola Maps Places API.
 *
 * <p>Wraps the external {@code api.olamaps.io/places/v1} endpoints
 * so the API key stays server-side.</p>
 */
public interface OlaMapsService {

    /** Autocomplete location search. */
    List<Map<String, Object>> searchLocation(String query);

    /** Reverse geocode lat/lng to address. */
    Map<String, Object> reverseGeocode(double lat, double lng);
}
