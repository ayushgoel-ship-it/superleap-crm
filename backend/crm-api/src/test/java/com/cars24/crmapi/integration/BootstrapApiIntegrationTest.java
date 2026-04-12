package com.cars24.crmapi.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end test: HTTP request through auth filters, controller,
 * service, repository, real Postgres — full stack.
 */
class BootstrapApiIntegrationTest extends AbstractContainerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void bootstrap_kam_returnsProfileWithoutHierarchy() throws Exception {
        mockMvc.perform(get("/web/v1/bootstrap")
                        .header("X-User-Id", "kam-e2e-01")
                        .header("X-User-Role", "KAM")
                        .header("X-Team-Id", "team-x"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profile.user_id").value("kam-e2e-01"))
                .andExpect(jsonPath("$.data.profile.role").value("KAM"))
                .andExpect(jsonPath("$.data.org_hierarchy").doesNotExist());
    }

    @Test
    void bootstrap_admin_returnsProfileWithHierarchy() throws Exception {
        mockMvc.perform(get("/web/v1/bootstrap")
                        .header("X-User-Id", "admin-e2e-01")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profile.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.org_hierarchy").exists());
    }

    @Test
    void bootstrap_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/web/v1/bootstrap"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void appBootstrap_kam_returnsProfile() throws Exception {
        mockMvc.perform(get("/app/v1/bootstrap")
                        .header("X-User-Id", "kam-app-01")
                        .header("X-User-Role", "KAM")
                        .header("X-Team-Id", "team-y"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profile.user_id").value("kam-app-01"));
    }
}
