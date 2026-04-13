package com.cars24.crmcore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "crm.cache")
public class CrmCacheProperties {

    private boolean enabled;
    private String provider;
    private Long defaultTtlSeconds;
    private String keyPrefix;
}
