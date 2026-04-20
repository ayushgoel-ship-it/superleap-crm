package com.cars24.crmapi.integration;

import com.cars24.crmcore.repository.postgres.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
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
    @Autowired private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // Only purge test-created teams. Seeded teams have referencing users
        // (FK users.team_id), so a blanket deleteAll would violate the FK.
        // The test creates teams with name prefix "E2E " — scope cleanup to
        // those, plus null any stray user references first as a safety net.
        jdbcTemplate.update(
            "UPDATE users SET team_id = NULL "
            + "WHERE team_id IN (SELECT team_id FROM teams WHERE team_name LIKE 'E2E %')"
        );
        jdbcTemplate.update("DELETE FROM teams WHERE team_name LIKE 'E2E %'");
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

        // Scope assertion to the test-created prefix; seeded teams may exist.
        Integer e2eCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*)::int FROM teams WHERE team_name LIKE 'E2E %'", Integer.class);
        assertThat(e2eCount).isEqualTo(1);

        // List all teams — verify the new one is present (don't assert exact size).
        mockMvc.perform(get("/web/v1/admin/teams")
                        .header("X-User-Id", "admin-e2e-01")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.teamName=='E2E Team Alpha')]").exists());

        // List by region — at least our team is present.
        mockMvc.perform(get("/web/v1/admin/teams")
                        .param("region", "North")
                        .header("X-User-Id", "admin-e2e-01")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.teamName=='E2E Team Alpha')]").exists());
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
