package com.cars24.crmapi.util;

import com.cars24.crmapi.config.JwtConfig;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtReaderTest {

    private static final String VALID_SECRET = "test-secret-key-with-at-least-32-bytes";
    private static final String OTHER_SECRET = "other-secret-key-with-at-least-32-bytes";

    @Test
    void parsesValidToken() {
        JwtReader jwtReader = new JwtReader(jwtConfig(VALID_SECRET, "test-issuer", "crm-api"));
        String token = buildJwt(VALID_SECRET, "test-issuer", "crm-api", Instant.now().plusSeconds(900));

        assertEquals("kam-01", jwtReader.parseJwtToken(token).get("user_id", String.class));
    }

    @Test
    void rejectsWrongSignature() {
        JwtReader jwtReader = new JwtReader(jwtConfig(VALID_SECRET, "test-issuer", "crm-api"));
        String token = buildJwt(OTHER_SECRET, "test-issuer", "crm-api", Instant.now().plusSeconds(900));

        assertThrows(JwtException.class, () -> jwtReader.parseJwtToken(token));
    }

    @Test
    void rejectsWrongIssuer() {
        JwtReader jwtReader = new JwtReader(jwtConfig(VALID_SECRET, "test-issuer", "crm-api"));
        String token = buildJwt(VALID_SECRET, "other-issuer", "crm-api", Instant.now().plusSeconds(900));

        assertThrows(JwtException.class, () -> jwtReader.parseJwtToken(token));
    }

    @Test
    void rejectsWrongAudience() {
        JwtReader jwtReader = new JwtReader(jwtConfig(VALID_SECRET, "test-issuer", "crm-api"));
        String token = buildJwt(VALID_SECRET, "test-issuer", "other-audience", Instant.now().plusSeconds(900));

        assertThrows(JwtException.class, () -> jwtReader.parseJwtToken(token));
    }

    @Test
    void rejectsExpiredToken() {
        JwtReader jwtReader = new JwtReader(jwtConfig(VALID_SECRET, "test-issuer", "crm-api"));
        String token = buildJwt(VALID_SECRET, "test-issuer", "crm-api", Instant.now().minusSeconds(60));

        assertThrows(JwtException.class, () -> jwtReader.parseJwtToken(token));
    }

    @Test
    void rejectsWeakSecret() {
        JwtReader jwtReader = new JwtReader(jwtConfig("short", "test-issuer", "crm-api"));
        String token = buildJwt("short-but-padded-to-be-32-bytes!", "test-issuer", "crm-api",
                Instant.now().plusSeconds(900));

        assertThrows(JwtException.class, () -> jwtReader.parseJwtToken(token),
                "Should reject secrets shorter than 32 bytes");
    }

    private JwtConfig jwtConfig(String secret, String issuer, String audience) {
        JwtConfig jwtConfig = new JwtConfig();
        jwtConfig.setEnabled(true);
        jwtConfig.setSecret(secret);
        jwtConfig.setIssuer(issuer);
        jwtConfig.setAudience(audience);
        return jwtConfig;
    }

    private String buildJwt(String secret, String issuer, String audience, Instant expiresAt) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setClaims(Map.of("user_id", "kam-01", "role", "KAM"))
                .setIssuer(issuer)
                .setAudience(audience)
                .setIssuedAt(new Date())
                .setExpiration(Date.from(expiresAt))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
