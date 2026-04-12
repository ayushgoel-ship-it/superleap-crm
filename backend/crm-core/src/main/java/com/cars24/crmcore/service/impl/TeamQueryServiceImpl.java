package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.TeamRepository;
import com.cars24.crmcore.service.internal.TeamQueryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class TeamQueryServiceImpl implements TeamQueryService {

    private final TeamRepository teamRepository;

    public TeamQueryServiceImpl(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    @Override
    public List<TeamEntity> listTeams(String region) {
        if (region != null) return teamRepository.findByRegion(region);
        return teamRepository.findAll();
    }

    @Override
    public TeamEntity getTeamDetail(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));
    }
}
