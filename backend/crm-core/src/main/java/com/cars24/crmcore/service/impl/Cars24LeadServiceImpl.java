package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.Cars24Properties;
import com.cars24.crmcore.exception.ExternalDependencyException;
import com.cars24.crmcore.service.internal.Cars24LeadService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Proxies Cars24 partners-lead API calls for lead creation, price
 * estimation, appointment booking, and OTP verification.
 */
@Service
public class Cars24LeadServiceImpl implements Cars24LeadService {

    private static final Logger log = LoggerFactory.getLogger(Cars24LeadServiceImpl.class);

    private final Cars24Properties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Counter c24LeadsCreatedCounter;
    private final Counter c24AppointmentsBookedCounter;

    public Cars24LeadServiceImpl(Cars24Properties properties,
                                  ObjectMapper objectMapper,
                                  MeterRegistry meterRegistry) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getPartnersLeadService().getConnectTimeoutMs()))
                .build();
        this.c24LeadsCreatedCounter = Counter.builder("crm.c24.leads.created")
                .description("Leads created via C24 API").register(meterRegistry);
        this.c24AppointmentsBookedCounter = Counter.builder("crm.c24.appointments.booked")
                .description("Appointments booked via C24 API").register(meterRegistry);
    }

    @Override
    public Map<String, Object> estimatePrice(String dealerCode, Map<String, Object> payload, String sessionToken) {
        String path = "/v1/kam/db/" + dealerCode + "/estimate-price";
        return post(path, payload, sessionToken);
    }

    @Override
    public Map<String, Object> createLead(String dealerCode, Map<String, Object> payload, String sessionToken) {
        String path = "/v1/kam/db/" + dealerCode + "/leads";
        Map<String, Object> result = post(path, payload, sessionToken);
        c24LeadsCreatedCounter.increment();
        return result;
    }

    @Override
    public Map<String, Object> getSlots(String leadId, String dealerCode,
                                         double lat, double lng, String sessionToken) {
        String path = "/v1/kam/db/" + dealerCode + "/leads/" + leadId
                + "/slots?userLat=" + lat + "&userLng=" + lng;
        return get(path, sessionToken);
    }

    @Override
    public Map<String, Object> bookAppointment(String leadId, String dealerCode,
                                                Map<String, Object> payload, String sessionToken) {
        String path = "/v1/kam/db/" + dealerCode + "/leads/" + leadId + "/book-appointment";
        Map<String, Object> result = post(path, payload, sessionToken);
        c24AppointmentsBookedCounter.increment();
        return result;
    }

    @Override
    public Map<String, Object> rescheduleAppointment(String leadId, String dealerCode,
                                                      Map<String, Object> payload, String sessionToken) {
        String path = "/v1/kam/db/" + dealerCode + "/leads/" + leadId + "/reschedule-appointment";
        return post(path, payload, sessionToken);
    }

    @Override
    public Map<String, Object> sendOtp(String leadId, String dealerCode, String sessionToken) {
        String path = "/v1/kam/db/" + dealerCode + "/leads/" + leadId + "/send-appointment-otp";
        return post(path, Map.of(), sessionToken);
    }

    @Override
    public Map<String, Object> verifyOtp(String leadId, String dealerCode,
                                          String otp, String sessionToken) {
        String path = "/v1/kam/db/" + dealerCode + "/leads/" + leadId + "/verify-appointment-otp";
        return post(path, Map.of("otp", otp), sessionToken);
    }

    // ── HTTP helpers ──

    private Map<String, Object> get(String path, String sessionToken) {
        String url = properties.getPartnersLeadService().getBaseUrl() + path;
        HttpRequest request = buildRequest(url, "GET", null, sessionToken);
        return execute(request, path);
    }

    private Map<String, Object> post(String path, Map<String, Object> payload, String sessionToken) {
        String url = properties.getPartnersLeadService().getBaseUrl() + path;
        try {
            String body = objectMapper.writeValueAsString(payload);
            HttpRequest request = buildRequest(url, "POST", body, sessionToken);
            return execute(request, path);
        } catch (Exception e) {
            throw new ExternalDependencyException("Failed to serialize C24 request: " + e.getMessage());
        }
    }

    private Map<String, Object> execute(HttpRequest request, String path) {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("C24 partners-lead API failed: status={}, path={}, body={}",
                        response.statusCode(), path, response.body());
                throw new ExternalDependencyException(
                        "C24 partners-lead API returned " + response.statusCode());
            }
            return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
        } catch (ExternalDependencyException e) {
            throw e;
        } catch (Exception e) {
            log.error("C24 partners-lead API error: path={}", path, e);
            throw new ExternalDependencyException("Failed to call C24 partners-lead API: " + e.getMessage());
        }
    }

    private HttpRequest buildRequest(String url, String method, String body, String sessionToken) {
        Cars24Properties.PartnersLeadService cfg = properties.getPartnersLeadService();
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(cfg.getReadTimeoutMs()))
                .header("Content-Type", "application/json");

        if (cfg.getBasicAuth() != null) {
            builder.header("Authorization", "Basic " + cfg.getBasicAuth());
        }
        if (sessionToken != null && !sessionToken.isBlank()) {
            builder.header("x-auth-key", sessionToken);
        }

        if ("POST".equals(method) && body != null) {
            builder.POST(HttpRequest.BodyPublishers.ofString(body));
        } else {
            builder.GET();
        }

        return builder.build();
    }
}
