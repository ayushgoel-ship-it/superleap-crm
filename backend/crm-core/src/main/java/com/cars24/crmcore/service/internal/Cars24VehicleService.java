package com.cars24.crmcore.service.internal;

import java.util.List;
import java.util.Map;

/**
 * Proxy service for Cars24 vehicle catalog APIs.
 *
 * <p>Wraps the external {@code gateway.24c.in/vehicle} endpoints so
 * the frontend never touches C24 credentials directly.</p>
 */
public interface Cars24VehicleService {

    /** Get all car makes (brands). */
    List<Map<String, Object>> getMakes(String sessionToken);

    /** Get manufacturing years for a given make. */
    List<Map<String, Object>> getYears(String makeId, String sessionToken);

    /** Get models for a given make + year. */
    List<Map<String, Object>> getModels(String makeId, String year, String sessionToken);

    /** Get variants for a given model + year. */
    List<Map<String, Object>> getVariants(String modelId, String year, String sessionToken);

    /** Get all states for location selection. */
    List<Map<String, Object>> getStates(String sessionToken);

    /** Get cities for a given state. */
    List<Map<String, Object>> getCities(String stateId, String sessionToken);

    /** Get RTO codes for a given state. */
    List<Map<String, Object>> getRTOCodes(String stateId, String sessionToken);

    /** Lookup vehicle details by registration number. */
    Map<String, Object> lookupVehicle(String regNo, String sessionToken);
}
