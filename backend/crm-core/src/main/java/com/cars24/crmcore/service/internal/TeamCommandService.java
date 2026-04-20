package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.CreateTeamCommand;
import com.cars24.crmcore.dto.command.UpdateTeamCommand;
import com.cars24.crmcore.entity.TeamEntity;

import java.util.UUID;

public interface TeamCommandService {

    TeamEntity createTeam(CreateTeamCommand command, UUID actorId, String requestId);

    TeamEntity updateTeam(UUID teamId, UpdateTeamCommand command, UUID actorId, String requestId);
}
