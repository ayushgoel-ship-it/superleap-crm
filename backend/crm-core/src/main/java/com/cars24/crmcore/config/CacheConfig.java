package com.cars24.crmcore.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Cache key constants used by @Cacheable annotations across services.
     */
    public static final String CACHE_ORG_HIERARCHY = "org:hierarchy";
    public static final String CACHE_TARGETS = "targets";
    public static final String CACHE_INCENTIVE_SLABS = "incentive:slabs";
    public static final String CACHE_INCENTIVE_RULES = "incentive:rules";
    public static final String CACHE_METRIC_DEFINITIONS = "metric:definitions";

    /**
     * In-memory cache manager used when Redis is disabled (default).
     * Suitable for single-instance deployments and testing.
     */
    @Bean
    @ConditionalOnProperty(name = "crm.cache.enabled", havingValue = "false", matchIfMissing = true)
    public CacheManager inMemoryCacheManager() {
        return new ConcurrentMapCacheManager(
                CACHE_ORG_HIERARCHY,
                CACHE_TARGETS,
                CACHE_INCENTIVE_SLABS,
                CACHE_INCENTIVE_RULES,
                CACHE_METRIC_DEFINITIONS
        );
    }
}
