package com.cars24.crmapi.integration;

import com.cars24.crmapi.CrmApiApplication;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for integration tests that need a real PostgreSQL instance.
 *
 * Uses the singleton-container pattern: one PostgreSQL container is
 * started on first class load and reused for the lifetime of the JVM.
 * The JVM exit hook reaps it. This is required because Spring caches
 * application contexts across test classes — a per-class @Container
 * lifecycle would tear down Postgres while subsequent test classes
 * still hold a Hikari pool pointing at it.
 */
@SpringBootTest(classes = CrmApiApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("integration")
@Testcontainers(disabledWithoutDocker = true)
public abstract class AbstractContainerTest {

    static final PostgreSQLContainer<?> POSTGRES;

    static {
        POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("crm_integration")
                .withUsername("crm")
                .withPassword("crm")
                .withReuse(false);
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    }
}
