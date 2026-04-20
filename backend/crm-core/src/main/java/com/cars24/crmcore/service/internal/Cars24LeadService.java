package com.cars24.crmcore.service.internal;

import java.util.Map;

/**
 * Proxy service for Cars24 partners-lead APIs.
 *
 * <p>Wraps the external {@code gateway.24c.in/partners-lead} endpoints
 * for lead creation, price estimation, and appointment booking.</p>
 */
public interface Cars24LeadService {

    /** Estimate price range for a vehicle. */
    Map<String, Object> estimatePrice(String dealerCode, Map<String, Object> payload, String sessionToken);

    /** Create a new lead via C24 API. Returns {leadStatus, leadId?}. */
    Map<String, Object> createLead(String dealerCode, Map<String, Object> payload, String sessionToken);

    /** Get available appointment slots. */
    Map<String, Object> getSlots(String leadId, String dealerCode,
                                  double lat, double lng, String sessionToken);

    /** Book an appointment for a lead. */
    Map<String, Object> bookAppointment(String leadId, String dealerCode,
                                         Map<String, Object> payload, String sessionToken);

    /** Reschedule an existing appointment. */
    Map<String, Object> rescheduleAppointment(String leadId, String dealerCode,
                                               Map<String, Object> payload, String sessionToken);

    /** Send OTP for appointment verification. */
    Map<String, Object> sendOtp(String leadId, String dealerCode, String sessionToken);

    /** Verify OTP for appointment confirmation. */
    Map<String, Object> verifyOtp(String leadId, String dealerCode,
                                   String otp, String sessionToken);
}
