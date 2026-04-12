package com.cars24.crmapi.util;

import com.cars24.crmapi.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;

@Component
public class JwtReader {

    private final JwtConfig jwtConfig;

    public JwtReader(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    public Claims parseJwtToken(String jwtToken) {
        if (!jwtConfig.isEnabled()) {
            throw new JwtException("JWT authentication is disabled");
        }

        Key signingKey = getSigningKey();
        var parserBuilder = Jwts.parserBuilder().setSigningKey(signingKey);
        if (jwtConfig.getIssuer() != null && !jwtConfig.getIssuer().isBlank()) {
            parserBuilder.requireIssuer(jwtConfig.getIssuer());
        }
        Jws<Claims> jwsClaims = parserBuilder
                .build()
                .parseClaimsJws(jwtToken);

        Claims claims = jwsClaims.getBody();
        String configuredAudience = jwtConfig.getAudience();
        if (configuredAudience != null && !configuredAudience.isBlank()) {
            Object audienceClaim = claims.get("aud");
            String audience = audienceClaim == null ? claims.getAudience() : String.valueOf(audienceClaim);
            if (!configuredAudience.equals(audience)) {
                throw new JwtException("JWT audience is invalid");
            }
        }
        return claims;
    }

    private Key getSigningKey() {
        String secret = jwtConfig.getSecret();
        if (secret == null || secret.isBlank()) {
            throw new JwtException("JWT secret is not configured");
        }

        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException | DecodingException ignored) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            throw new JwtException(
                    "JWT secret is too short: HMAC-SHA256 requires at least 32 bytes, got " + keyBytes.length);
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }
}
