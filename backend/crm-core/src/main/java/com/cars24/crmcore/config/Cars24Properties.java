package com.cars24.crmcore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Typed configuration for Cars24 external service integration.
 *
 * <p>Credentials and base URLs are injected from environment variables so that
 * no secrets are hardcoded. The frontend proxies all C24 calls through the
 * backend, which adds the auth headers server-side.</p>
 *
 * YAML path: {@code crm.cars24.*}
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "crm.cars24")
public class Cars24Properties {

    private VehicleService vehicleService = new VehicleService();
    private PartnersLeadService partnersLeadService = new PartnersLeadService();
    private OlaMaps olaMaps = new OlaMaps();

    @Getter
    @Setter
    public static class VehicleService {
        /** Base URL for the C24 vehicle catalog service. */
        private String baseUrl = "https://gateway.24c.in/vehicle";
        /** Base64-encoded Basic auth credential (username:password). */
        private String basicAuth;
        /** Session token header (x-auth-key) — rotated per KAM session. */
        private String sessionToken;
        private long connectTimeoutMs = 5000;
        private long readTimeoutMs = 10000;
        private boolean enabled = true;
    }

    @Getter
    @Setter
    public static class PartnersLeadService {
        /** Base URL for the C24 partners-lead service. */
        private String baseUrl = "https://gateway.24c.in/partners-lead";
        /** Base64-encoded Basic auth credential (username:password). */
        private String basicAuth;
        /** Session token header (x-auth-key) — rotated per KAM session. */
        private String sessionToken;
        private long connectTimeoutMs = 5000;
        private long readTimeoutMs = 15000;
        private boolean enabled = true;
    }

    @Getter
    @Setter
    public static class OlaMaps {
        /** Base URL for Ola Maps Places API. */
        private String baseUrl = "https://api.olamaps.io/places/v1";
        /** API key for Ola Maps authentication. */
        private String apiKey;
        private long connectTimeoutMs = 3000;
        private long readTimeoutMs = 5000;
        private boolean enabled = true;
    }
}
