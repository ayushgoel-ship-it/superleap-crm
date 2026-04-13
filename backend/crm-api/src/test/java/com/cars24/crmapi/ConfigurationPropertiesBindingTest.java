package com.cars24.crmapi;

import com.cars24.crmapi.config.JwtConfig;
import com.cars24.crmcore.config.CrmCacheProperties;
import com.cars24.crmcore.config.CrmDatabaseProperties;
import com.cars24.crmcore.config.CrmExternalServicesProperties;
import com.cars24.crmcore.config.CrmStorageProperties;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(classes = CrmApiApplication.class)
@ActiveProfiles("test")
class ConfigurationPropertiesBindingTest {

    @Autowired
    private CrmDatabaseProperties databaseProperties;

    @Autowired
    private CrmCacheProperties cacheProperties;

    @Autowired
    private CrmStorageProperties storageProperties;

    @Autowired
    private CrmExternalServicesProperties externalServicesProperties;

    @Autowired
    private JwtConfig jwtConfig;

    @Test
    void bindsBootstrapPropertiesAcrossModules() {
        assertEquals("localhost", databaseProperties.getHost());
        assertEquals(5432, databaseProperties.getPort());
        assertEquals("crm_test", databaseProperties.getDatabase());
        assertFalse(databaseProperties.isSslEnabled());

        assertEquals("none", cacheProperties.getProvider());
        assertEquals(300L, cacheProperties.getDefaultTtlSeconds());
        assertEquals("crm:test", cacheProperties.getKeyPrefix());

        assertEquals("s3", storageProperties.getProvider());
        assertEquals("crm-test-bucket", storageProperties.getBucket());
        assertEquals(300L, storageProperties.getPresignedUrlExpirationSeconds());

        assertNotNull(externalServicesProperties.getEndpoints().get("admin"));
        assertEquals("http://localhost:8081",
                externalServicesProperties.getEndpoints().get("admin").getBaseUrl());
        assertTrue(externalServicesProperties.getEndpoints().get("admin").isEnabled());
        assertFalse(externalServicesProperties.getEndpoints().get("notification").isEnabled());

        assertEquals("test-issuer", jwtConfig.getIssuer());
        assertEquals("crm-api", jwtConfig.getAudience());
        assertTrue(jwtConfig.isEnabled());
        assertTrue(jwtConfig.isDevHeaderFallbackEnabled());
    }
}
