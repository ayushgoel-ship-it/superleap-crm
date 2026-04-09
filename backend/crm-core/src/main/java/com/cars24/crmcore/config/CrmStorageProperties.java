package com.cars24.crmcore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "crm.storage")
public class CrmStorageProperties {

    private boolean enabled;
    private String provider;
    private String bucket;
    private String region;
    private Long presignedUrlExpirationSeconds;
}
