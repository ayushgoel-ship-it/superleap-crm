package com.cars24.crmapi.filter;

import com.cars24.crmapi.CrmApiApplication;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.nullValue;

@SpringBootTest(classes = CrmApiApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFilterIntegrationTest {

    private static final String TEST_SECRET = "test-secret-key-with-at-least-32-bytes";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void rejectsMissingCredentialsOnProtectedRoute() throws Exception {
        mockMvc.perform(get("/web/v1/test/auth-context"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").value(nullValue()))
                .andExpect(jsonPath("$.meta.timestamp").exists())
                .andExpect(jsonPath("$.meta.request_id").exists())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Missing or invalid authentication credentials"));
    }

    @Test
    void rejectsMalformedBearerToken() throws Exception {
        mockMvc.perform(get("/web/v1/test/auth-context")
                        .header("Authorization", "Bearer definitely-not-a-jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Invalid JWT token"));
    }

    @Test
    void rejectsExpiredJwt() throws Exception {
        String token = buildJwt(
                Instant.now().minusSeconds(300),
                Map.of(
                        "user_id", "kam-expired",
                        "role", "KAM",
                        "permissions", List.of("READ_DASHBOARD"),
                        "team_id", "team-a"
                )
        );

        mockMvc.perform(get("/web/v1/test/auth-context")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("JWT token has expired"));
    }

    @Test
    void acceptsValidJwt() throws Exception {
        String token = buildJwt(
                Instant.now().plusSeconds(900),
                Map.of(
                        "user_id", "kam-01",
                        "role", "KAM",
                        "permissions", List.of("READ_DASHBOARD", "VIEW_DEALERS"),
                        "team_id", "team-a"
                )
        );

        mockMvc.perform(get("/web/v1/test/auth-context")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticatedUserId").value("kam-01"))
                .andExpect(jsonPath("$.effectiveUserId").value("kam-01"))
                .andExpect(jsonPath("$.scope").value("SELF"))
                .andExpect(jsonPath("$.tenantGroup").value("team-a"))
                .andExpect(jsonPath("$.authSource").value("jwt"));
    }

    @Test
    void acceptsDevHeadersInTestProfile() throws Exception {
        mockMvc.perform(get("/web/v1/test/auth-context")
                        .header("X-User-Id", "tl-01")
                        .header("X-User-Role", "TL")
                        .header("X-Team-Id", "team-b")
                        .header("X-Permissions", "READ_DASHBOARD,VIEW_TEAM_DEALERS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticatedUserId").value("tl-01"))
                .andExpect(jsonPath("$.effectiveUserId").value("tl-01"))
                .andExpect(jsonPath("$.scope").value("TEAM"))
                .andExpect(jsonPath("$.tenantGroup").value("team-b"))
                .andExpect(jsonPath("$.authSource").value("dev-headers"));
    }

    @Test
    void acceptsAdminImpersonationInDevHeaders() throws Exception {
        mockMvc.perform(get("/web/v1/test/auth-context")
                        .header("X-User-Id", "admin-01")
                        .header("X-User-Role", "ADMIN")
                        .header("X-Permissions", "IMPERSONATE")
                        .header("X-Impersonate-User-Id", "kam-02")
                        .header("X-Impersonate-User-Role", "KAM")
                        .header("X-Impersonate-Team-Id", "team-c")
                        .header("X-Impersonate-Permissions", "READ_DASHBOARD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticatedUserId").value("admin-01"))
                .andExpect(jsonPath("$.effectiveUserId").value("kam-02"))
                .andExpect(jsonPath("$.scope").value("IMPERSONATED"))
                .andExpect(jsonPath("$.roles[0]").value("KAM"))
                .andExpect(jsonPath("$.tenantGroup").value("team-c"));
    }

    @Test
    void rejectsNonAdminImpersonationAttempt() throws Exception {
        mockMvc.perform(get("/web/v1/test/auth-context")
                        .header("X-User-Id", "tl-02")
                        .header("X-User-Role", "TL")
                        .header("X-Impersonate-User-Id", "kam-03")
                        .header("X-Impersonate-User-Role", "KAM"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Only ADMIN can use dev impersonation headers"));
    }

    @Test
    void publicHealthBypassesAuthFilters() throws Exception {
        mockMvc.perform(get("/public/health"))
                .andExpect(status().isOk());
    }

    private String buildJwt(Instant expiresAt, Map<String, Object> claims) {
        Key key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setClaims(claims)
                .setIssuer("test-issuer")
                .setAudience("crm-api")
                .setIssuedAt(new Date())
                .setExpiration(Date.from(expiresAt))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
