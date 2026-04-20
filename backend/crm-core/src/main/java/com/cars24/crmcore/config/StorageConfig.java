package com.cars24.crmcore.config;

import com.cars24.crmcore.external.NoOpStorageClient;
import com.cars24.crmcore.external.StorageClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StorageConfig {

    @Bean
    @ConditionalOnProperty(name = "crm.storage.enabled", havingValue = "false", matchIfMissing = true)
    public StorageClient noOpStorageClient() {
        return new NoOpStorageClient();
    }
}
