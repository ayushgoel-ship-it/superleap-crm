package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.Cars24Properties;
import com.cars24.crmcore.exception.ExternalDependencyException;
import com.cars24.crmcore.service.internal.OlaMapsService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Proxies Ola Maps Places API calls so the API key stays server-side.
 */
@Service
public class OlaMapsServiceImpl implements OlaMapsService {

    private static final Logger log = LoggerFactory.getLogger(OlaMapsServiceImpl.class);

    private final Cars24Properties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public OlaMapsServiceImpl(Cars24Properties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getOlaMaps().getConnectTimeoutMs()))
                .build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchLocation(String query) {
        Cars24Properties.OlaMaps cfg = properties.getOlaMaps();
        if (!cfg.isEnabled() || cfg.getApiKey() == null) {
            return Collections.emptyList();
        }

        String url = cfg.getBaseUrl() + "/autocomplete?input="
                + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&api_key=" + cfg.getApiKey();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofMillis(cfg.getReadTimeoutMs()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("Ola Maps autocomplete failed: status={}", response.statusCode());
                return Collections.emptyList();
            }

            Map<String, Object> result = objectMapper.readValue(
                    response.body(), new TypeReference<Map<String, Object>>() {});
            if (result.containsKey("predictions") && result.get("predictions") instanceof List) {
                return (List<Map<String, Object>>) result.get("predictions");
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Ola Maps autocomplete error: query={}", query, e);
            return Collections.emptyList();
        }
    }

    @Override
    public Map<String, Object> reverseGeocode(double lat, double lng) {
        Cars24Properties.OlaMaps cfg = properties.getOlaMaps();
        if (!cfg.isEnabled() || cfg.getApiKey() == null) {
            return Collections.emptyMap();
        }

        String url = cfg.getBaseUrl() + "/reverse-geocode?latlng=" + lat + "," + lng
                + "&api_key=" + cfg.getApiKey();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofMillis(cfg.getReadTimeoutMs()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("Ola Maps reverse-geocode failed: status={}", response.statusCode());
                return Collections.emptyMap();
            }

            return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Ola Maps reverse-geocode error: lat={}, lng={}", lat, lng, e);
            return Collections.emptyMap();
        }
    }
}
