package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.CacheConfig;
import com.cars24.crmcore.dto.command.CreateTeamCommand;
import com.cars24.crmcore.dto.command.UpdateTeamCommand;
import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.TeamRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.TeamCommandService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class TeamCommandServiceImpl implements TeamCommandService {

    private final TeamRepository teamRepository;
    private final AuditService auditService;
    private final Counter teamsCreatedCounter;

    public TeamCommandServiceImpl(TeamRepository teamRepository,
                                  AuditService auditService,
                                  MeterRegistry meterRegistry) {
        this.teamRepository = teamRepository;
        this.auditService = auditService;
        this.teamsCreatedCounter = Counter.builder("crm.teams.created")
                .description("Number of teams created").register(meterRegistry);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_ORG_HIERARCHY, allEntries = true)
    public TeamEntity createTeam(CreateTeamCommand command, UUID actorId, String requestId) {
        TeamEntity entity = new TeamEntity();
        entity.setTeamName(command.getTeamName());
        entity.setRegion(command.getRegion());
        entity.setCity(command.getCity());
        entity.setTlUserId(command.getTlUserId());
        entity.setCreatedAt(Instant.now());

        TeamEntity saved = teamRepository.save(entity);
        teamsCreatedCounter.increment();

        auditService.log(actorId, "ADMIN", "TEAM_CREATE",
                "teams", saved.getTeamId().toString(), null, null,
                "Created team " + command.getTeamName() + " in " + command.getRegion(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_ORG_HIERARCHY, allEntries = true)
    public TeamEntity updateTeam(UUID teamId, UpdateTeamCommand command, UUID actorId, String requestId) {
        TeamEntity entity = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));

        if (command.getTeamName() != null) entity.setTeamName(command.getTeamName());
        if (command.getRegion() != null) entity.setRegion(command.getRegion());
        if (command.getCity() != null) entity.setCity(command.getCity());
        if (command.getTlUserId() != null) entity.setTlUserId(command.getTlUserId());
        entity.setUpdatedAt(Instant.now());

        TeamEntity saved = teamRepository.save(entity);

        auditService.log(actorId, "ADMIN", "TEAM_UPDATE",
                "teams", teamId.toString(), null, null,
                "Updated team " + entity.getTeamName(),
                requestId);

        return saved;
    }
}
