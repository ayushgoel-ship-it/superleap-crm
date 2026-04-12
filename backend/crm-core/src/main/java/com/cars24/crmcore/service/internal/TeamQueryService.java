package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.entity.TeamEntity;

import java.util.List;
import java.util.UUID;

public interface TeamQueryService {

    List<TeamEntity> listTeams(String region);

    TeamEntity getTeamDetail(UUID teamId);
}
