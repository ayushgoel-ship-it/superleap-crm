package com.cars24.crmapi.config;

import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;

@Getter
@Setter
@ConfigurationProperties(prefix = "crm.jwt")
public class JwtConfig {

    private boolean enabled = true;
    private String issuer;
    private String audience;
    private String secret;
    private boolean devHeaderFallbackEnabled;

    /**
     * Fail fast at application start if JWT auth is enabled but the secret
     * is missing or too weak for HMAC-SHA256. Without this guard a missing
     * CRM_JWT_SECRET in a prod manifest produces a 401 on every request
     * with no obvious root cause — a silent prod outage. Better to refuse
     * to boot.
     */
    @PostConstruct
    void validate() {
        if (!enabled) {
            return;
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "crm.jwt.secret is required when crm.jwt.enabled=true. "
                            + "Set CRM_JWT_SECRET to a base64-encoded value (or 32+ char "
                            + "ASCII string) in the application environment before starting.");
        }
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException | DecodingException ignored) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "crm.jwt.secret is too short: HMAC-SHA256 requires at least 32 bytes, "
                            + "got " + keyBytes.length + ". Generate a stronger key.");
        }
    }
}
