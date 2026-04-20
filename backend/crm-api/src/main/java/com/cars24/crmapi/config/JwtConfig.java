package com.cars24.crmapi.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "crm.jwt")
public class JwtConfig {

    private boolean enabled = true;
    private String issuer;
    private String audience;
    private String secret;
    private boolean devHeaderFallbackEnabled;
}
