package com.cars24.crmapi.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that all Flyway migrations apply cleanly against a real
 * PostgreSQL instance and that Hibernate schema validation passes.
 * If the Spring context loads, Flyway ran and Hibernate validated — this
 * test adds explicit assertions on the migration history and table presence.
 */
class FlywayMigrationTest extends AbstractContainerTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private DataSource dataSource;

    @Test
    void allMigrationsAppliedSuccessfully() {
        var info = flyway.info();
        var applied = info.applied();

        assertThat(applied).hasSizeGreaterThanOrEqualTo(8);

        List<String> versions = new ArrayList<>();
        for (var migration : applied) {
            versions.add(migration.getVersion().getVersion());
            assertThat(migration.getState().isApplied()).isTrue();
        }

        assertThat(versions).contains("001", "002", "003", "004", "005", "006", "007", "008");
    }

    @Test
    void coreTablesExist() throws Exception {
        List<String> expectedTables = List.of(
                "teams", "users",
                "dealers_master", "sell_leads_master", "dcf_leads_master",
                "call_events", "visits", "tasks",
                "lead_timeline_events", "dcf_timeline_events", "notifications",
                "targets", "incentive_slabs", "incentive_rules",
                "audit_log", "upload_metadata", "async_jobs");

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                     "SELECT table_name FROM information_schema.tables " +
                     "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")) {

            List<String> actualTables = new ArrayList<>();
            while (rs.next()) {
                actualTables.add(rs.getString("table_name"));
            }

            assertThat(actualTables).containsAll(expectedTables);
        }
    }
}
