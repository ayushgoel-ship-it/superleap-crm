package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.CacheConfig;
import com.cars24.crmcore.dto.command.*;
import com.cars24.crmcore.entity.IncentiveRuleEntity;
import com.cars24.crmcore.entity.IncentiveSlabEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.IncentiveRuleRepository;
import com.cars24.crmcore.repository.postgres.IncentiveSlabRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.ConfigCommandService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class ConfigCommandServiceImpl implements ConfigCommandService {

    private final IncentiveSlabRepository slabRepository;
    private final IncentiveRuleRepository ruleRepository;
    private final AuditService auditService;

    public ConfigCommandServiceImpl(IncentiveSlabRepository slabRepository,
                                    IncentiveRuleRepository ruleRepository,
                                    AuditService auditService) {
        this.slabRepository = slabRepository;
        this.ruleRepository = ruleRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_INCENTIVE_SLABS, allEntries = true)
    public IncentiveSlabEntity createSlab(CreateIncentiveSlabCommand command, UUID actorId, String requestId) {
        IncentiveSlabEntity entity = new IncentiveSlabEntity();
        entity.setSlabName(command.getSlabName());
        entity.setMetricKey(command.getMetricKey());
        entity.setMinValue(command.getMinValue());
        entity.setMaxValue(command.getMaxValue());
        entity.setPayoutAmount(command.getPayoutAmount());
        entity.setPayoutType(command.getPayoutType());
        entity.setRoleScope(command.getRoleScope());
        entity.setEffectiveFrom(command.getEffectiveFrom());
        entity.setEffectiveTo(command.getEffectiveTo());
        entity.setCreatedAt(Instant.now());

        IncentiveSlabEntity saved = slabRepository.save(entity);

        auditService.log(actorId, "ADMIN", "CONFIG_CREATE_SLAB",
                "incentive_slabs", saved.getSlabId().toString(),
                null, null,
                "Created slab " + command.getSlabName() + " for metric " + command.getMetricKey(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_INCENTIVE_SLABS, allEntries = true)
    public IncentiveSlabEntity updateSlab(UUID slabId, UpdateIncentiveSlabCommand command,
                                          UUID actorId, String requestId) {
        IncentiveSlabEntity entity = slabRepository.findById(slabId)
                .orElseThrow(() -> new ResourceNotFoundException("Incentive slab not found: " + slabId));

        if (command.getSlabName() != null) entity.setSlabName(command.getSlabName());
        if (command.getMinValue() != null) entity.setMinValue(command.getMinValue());
        if (command.getMaxValue() != null) entity.setMaxValue(command.getMaxValue());
        if (command.getPayoutAmount() != null) entity.setPayoutAmount(command.getPayoutAmount());
        if (command.getPayoutType() != null) entity.setPayoutType(command.getPayoutType());
        if (command.getRoleScope() != null) entity.setRoleScope(command.getRoleScope());
        if (command.getEffectiveFrom() != null) entity.setEffectiveFrom(command.getEffectiveFrom());
        if (command.getEffectiveTo() != null) entity.setEffectiveTo(command.getEffectiveTo());
        entity.setUpdatedAt(Instant.now());

        IncentiveSlabEntity saved = slabRepository.save(entity);

        auditService.log(actorId, "ADMIN", "CONFIG_UPDATE_SLAB",
                "incentive_slabs", slabId.toString(),
                null, null,
                "Updated slab " + entity.getSlabName(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_INCENTIVE_RULES, allEntries = true)
    public IncentiveRuleEntity createRule(CreateIncentiveRuleCommand command, UUID actorId, String requestId) {
        IncentiveRuleEntity entity = new IncentiveRuleEntity();
        entity.setScope(command.getScope());
        entity.setMetricKey(command.getMetricKey());
        entity.setThreshold(command.getThreshold());
        entity.setPayout(command.getPayout());
        entity.setDescription(command.getDescription());
        entity.setEffectiveFrom(command.getEffectiveFrom());
        entity.setEffectiveTo(command.getEffectiveTo());
        entity.setCreatedAt(Instant.now());

        IncentiveRuleEntity saved = ruleRepository.save(entity);

        auditService.log(actorId, "ADMIN", "CONFIG_CREATE_RULE",
                "incentive_rules", saved.getRuleId().toString(),
                null, null,
                "Created rule for " + command.getMetricKey() + " scope=" + command.getScope(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_INCENTIVE_RULES, allEntries = true)
    public IncentiveRuleEntity updateRule(UUID ruleId, UpdateIncentiveRuleCommand command,
                                          UUID actorId, String requestId) {
        IncentiveRuleEntity entity = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Incentive rule not found: " + ruleId));

        if (command.getScope() != null) entity.setScope(command.getScope());
        if (command.getThreshold() != null) entity.setThreshold(command.getThreshold());
        if (command.getPayout() != null) entity.setPayout(command.getPayout());
        if (command.getDescription() != null) entity.setDescription(command.getDescription());
        if (command.getEffectiveFrom() != null) entity.setEffectiveFrom(command.getEffectiveFrom());
        if (command.getEffectiveTo() != null) entity.setEffectiveTo(command.getEffectiveTo());
        entity.setUpdatedAt(Instant.now());

        IncentiveRuleEntity saved = ruleRepository.save(entity);

        auditService.log(actorId, "ADMIN", "CONFIG_UPDATE_RULE",
                "incentive_rules", ruleId.toString(),
                null, null,
                "Updated rule " + entity.getDescription(),
                requestId);

        return saved;
    }
}
