package com.cars24.crmcore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@ConfigurationProperties(prefix = "crm.services")
public class CrmExternalServicesProperties {

    private Map<String, ServiceEndpointProperties> endpoints = new LinkedHashMap<>();

    @Getter
    @Setter
    public static class ServiceEndpointProperties {

        private String baseUrl;
        private Long connectTimeoutMs;
        private Long readTimeoutMs;
        private boolean enabled;
    }
}
