package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.Cars24Properties;
import com.cars24.crmcore.exception.ExternalDependencyException;
import com.cars24.crmcore.service.internal.Cars24VehicleService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Proxies Cars24 vehicle catalog API calls, injecting auth server-side.
 *
 * <p>All vehicle service calls require both Basic auth and a session token
 * (x-auth-key header). The session token is passed per-request from the
 * frontend; the Basic auth credential is injected from server config.</p>
 */
@Service
public class Cars24VehicleServiceImpl implements Cars24VehicleService {

    private static final Logger log = LoggerFactory.getLogger(Cars24VehicleServiceImpl.class);

    private final Cars24Properties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public Cars24VehicleServiceImpl(Cars24Properties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getVehicleService().getConnectTimeoutMs()))
                .build();
    }

    @Override
    public List<Map<String, Object>> getMakes(String sessionToken) {
        return getList("/v1/make", sessionToken);
    }

    @Override
    public List<Map<String, Object>> getYears(String makeId, String sessionToken) {
        return getList("/v1/year?makeId=" + makeId, sessionToken);
    }

    @Override
    public List<Map<String, Object>> getModels(String makeId, String year, String sessionToken) {
        return getList("/v1/model?makeId=" + makeId + "&year=" + year, sessionToken);
    }

    @Override
    public List<Map<String, Object>> getVariants(String modelId, String year, String sessionToken) {
        return getList("/v1/variant?modelId=" + modelId + "&year=" + year, sessionToken);
    }

    @Override
    public List<Map<String, Object>> getStates(String sessionToken) {
        return getList("/v1/state", sessionToken);
    }

    @Override
    public List<Map<String, Object>> getCities(String stateId, String sessionToken) {
        return getList("/v1/city?stateId=" + stateId, sessionToken);
    }

    @Override
    public List<Map<String, Object>> getRTOCodes(String stateId, String sessionToken) {
        return getList("/v1/rto?stateId=" + stateId, sessionToken);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> lookupVehicle(String regNo, String sessionToken) {
        String url = properties.getVehicleService().getBaseUrl() + "/v6/vehicle-number/" + regNo;
        HttpRequest request = buildGetRequest(url, sessionToken);

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("C24 vehicle lookup failed: status={}, regNo={}", response.statusCode(), regNo);
                throw new ExternalDependencyException("C24 vehicle lookup failed: " + response.statusCode());
            }
            return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
        } catch (ExternalDependencyException e) {
            throw e;
        } catch (Exception e) {
            log.error("C24 vehicle lookup error for regNo={}", regNo, e);
            throw new ExternalDependencyException("Failed to lookup vehicle: " + e.getMessage());
        }
    }

    // ── Helpers ──

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getList(String path, String sessionToken) {
        String url = properties.getVehicleService().getBaseUrl() + path;
        HttpRequest request = buildGetRequest(url, sessionToken);

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("C24 vehicle API failed: status={}, path={}", response.statusCode(), path);
                throw new ExternalDependencyException("C24 vehicle API failed: " + response.statusCode());
            }

            // C24 vehicle API returns either a direct array or {detail: [...]}
            String body = response.body();
            if (body.trim().startsWith("[")) {
                return objectMapper.readValue(body, new TypeReference<List<Map<String, Object>>>() {});
            }
            Map<String, Object> wrapper = objectMapper.readValue(body, new TypeReference<Map<String, Object>>() {});
            if (wrapper.containsKey("detail") && wrapper.get("detail") instanceof List) {
                return (List<Map<String, Object>>) wrapper.get("detail");
            }
            return List.of(wrapper);
        } catch (ExternalDependencyException e) {
            throw e;
        } catch (Exception e) {
            log.error("C24 vehicle API error: path={}", path, e);
            throw new ExternalDependencyException("Failed to call C24 vehicle API: " + e.getMessage());
        }
    }

    private HttpRequest buildGetRequest(String url, String sessionToken) {
        Cars24Properties.VehicleService cfg = properties.getVehicleService();
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .timeout(Duration.ofMillis(cfg.getReadTimeoutMs()))
                .header("Content-Type", "application/json");

        if (cfg.getBasicAuth() != null) {
            builder.header("Authorization", "Basic " + cfg.getBasicAuth());
        }
        if (sessionToken != null && !sessionToken.isBlank()) {
            builder.header("x-auth-key", sessionToken);
        }

        return builder.build();
    }
}
