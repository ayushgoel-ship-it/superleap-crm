package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.CacheConfig;
import com.cars24.crmcore.entity.IncentiveRuleEntity;
import com.cars24.crmcore.entity.IncentiveSlabEntity;
import com.cars24.crmcore.repository.postgres.IncentiveRuleRepository;
import com.cars24.crmcore.repository.postgres.IncentiveSlabRepository;
import com.cars24.crmcore.service.internal.ConfigQueryService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConfigQueryServiceImpl implements ConfigQueryService {

    private final IncentiveSlabRepository slabRepository;
    private final IncentiveRuleRepository ruleRepository;

    public ConfigQueryServiceImpl(IncentiveSlabRepository slabRepository,
                                  IncentiveRuleRepository ruleRepository) {
        this.slabRepository = slabRepository;
        this.ruleRepository = ruleRepository;
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_INCENTIVE_SLABS, key = "'all:' + #metricKey + ':' + #roleScope")
    public List<IncentiveSlabEntity> listSlabs(String metricKey, String roleScope) {
        if (metricKey != null) return slabRepository.findByMetricKey(metricKey);
        if (roleScope != null) return slabRepository.findByRoleScope(roleScope);
        return slabRepository.findAll();
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_INCENTIVE_RULES, key = "'all:' + #metricKey + ':' + #scope")
    public List<IncentiveRuleEntity> listRules(String metricKey, String scope) {
        if (metricKey != null) return ruleRepository.findByMetricKey(metricKey);
        if (scope != null) return ruleRepository.findByScope(scope);
        return ruleRepository.findAll();
    }
}
