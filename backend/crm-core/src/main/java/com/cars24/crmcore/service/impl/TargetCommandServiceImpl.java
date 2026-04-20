package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.CacheConfig;
import com.cars24.crmcore.dto.command.InitializeMonthTargetsCommand;
import com.cars24.crmcore.dto.command.UpdateTargetCommand;
import com.cars24.crmcore.entity.TargetEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.TargetRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.TargetCommandService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TargetCommandServiceImpl implements TargetCommandService {

    private final TargetRepository targetRepository;
    private final AuditService auditService;

    public TargetCommandServiceImpl(TargetRepository targetRepository,
                                    AuditService auditService) {
        this.targetRepository = targetRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_TARGETS, allEntries = true)
    public TargetEntity updateTarget(UUID targetId, UpdateTargetCommand command,
                                     UUID actorId, String requestId) {
        TargetEntity entity = targetRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Target not found: " + targetId));

        if (command.getSiTarget() != null) entity.setSiTarget(command.getSiTarget());
        if (command.getCallTarget() != null) entity.setCallTarget(command.getCallTarget());
        if (command.getVisitTarget() != null) entity.setVisitTarget(command.getVisitTarget());
        if (command.getDcfLeadsTarget() != null) entity.setDcfLeadsTarget(command.getDcfLeadsTarget());
        if (command.getDcfDisbursalTarget() != null) entity.setDcfDisbursalTarget(command.getDcfDisbursalTarget());
        if (command.getRevenueTarget() != null) entity.setRevenueTarget(command.getRevenueTarget());
        entity.setUpdatedAt(Instant.now());

        TargetEntity saved = targetRepository.save(entity);

        auditService.log(
                actorId,
                "ADMIN",
                "TARGET_UPDATE",
                "targets",
                targetId.toString(),
                null,
                null,
                "Updated target for " + entity.getUserName() + " period " + entity.getPeriod(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_TARGETS, allEntries = true)
    public List<TargetEntity> initializeMonth(InitializeMonthTargetsCommand command,
                                              UUID actorId, String requestId) {
        // Copy targets from source period (or create empty targets)
        List<TargetEntity> sourceTargets = command.getSourcePeriod() != null
                ? targetRepository.findByPeriod(command.getSourcePeriod())
                : List.of();

        List<TargetEntity> newTargets = new ArrayList<>();

        for (TargetEntity source : sourceTargets) {
            // Skip if target already exists for this user + period
            if (targetRepository.findByUserIdAndPeriod(source.getUserId(), command.getPeriod()).isPresent()) {
                continue;
            }

            TargetEntity newTarget = new TargetEntity();
            newTarget.setUserId(source.getUserId());
            newTarget.setUserName(source.getUserName());
            newTarget.setTeamId(source.getTeamId());
            newTarget.setRole(source.getRole());
            newTarget.setPeriod(command.getPeriod());
            newTarget.setSiTarget(source.getSiTarget());
            newTarget.setCallTarget(source.getCallTarget());
            newTarget.setVisitTarget(source.getVisitTarget());
            newTarget.setDcfLeadsTarget(source.getDcfLeadsTarget());
            newTarget.setDcfDisbursalTarget(source.getDcfDisbursalTarget());
            newTarget.setRevenueTarget(source.getRevenueTarget());
            newTarget.setCreatedAt(Instant.now());

            newTargets.add(targetRepository.save(newTarget));
        }

        auditService.log(
                actorId,
                "ADMIN",
                "TARGET_INITIALIZE_MONTH",
                "targets",
                command.getPeriod(),
                null,
                null,
                "Initialized " + newTargets.size() + " targets for period " + command.getPeriod()
                        + (command.getSourcePeriod() != null ? " from " + command.getSourcePeriod() : ""),
                requestId);

        return newTargets;
    }
}
