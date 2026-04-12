package com.cars24.crmapi.integration;

import com.cars24.crmcore.repository.postgres.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end admin API tests: team CRUD, job polling.
 */
class AdminApiIntegrationTest extends AbstractContainerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TeamRepository teamRepository;

    @BeforeEach
    void setUp() {
        teamRepository.deleteAll();
    }

    @Test
    void createAndListTeams() throws Exception {
        String json = """
                {
                    "team_name": "E2E Team Alpha",
                    "region": "North",
                    "city": "Delhi"
                }
                """;

        mockMvc.perform(post("/web/v1/admin/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .header("X-User-Id", "admin-e2e-01")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.teamName").value("E2E Team Alpha"));

        assertThat(teamRepository.findAll()).hasSize(1);

        // List all teams
        mockMvc.perform(get("/web/v1/admin/teams")
                        .header("X-User-Id", "admin-e2e-01")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].teamName").value("E2E Team Alpha"));

        // List by region
        mockMvc.perform(get("/web/v1/admin/teams")
                        .param("region", "North")
                        .header("X-User-Id", "admin-e2e-01")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        // List by non-matching region
        mockMvc.perform(get("/web/v1/admin/teams")
                        .param("region", "South")
                        .header("X-User-Id", "admin-e2e-01")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void adminEndpoint_nonAdmin_returns403() throws Exception {
        mockMvc.perform(get("/web/v1/admin/teams")
                        .header("X-User-Id", "kam-e2e-01")
                        .header("X-User-Role", "KAM")
                        .header("X-Team-Id", "team-e2e"))
                .andExpect(status().isForbidden());
    }

    @Test
    void internalOrgHierarchy_returns200() throws Exception {
        mockMvc.perform(get("/internal/v1/org/hierarchy")
                        .header("X-User-Id", "service-e2e")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.regions").isArray());
    }
}
