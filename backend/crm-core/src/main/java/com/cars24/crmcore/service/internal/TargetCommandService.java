package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.InitializeMonthTargetsCommand;
import com.cars24.crmcore.dto.command.UpdateTargetCommand;
import com.cars24.crmcore.entity.TargetEntity;

import java.util.List;
import java.util.UUID;

public interface TargetCommandService {

    TargetEntity updateTarget(UUID targetId, UpdateTargetCommand command,
                              UUID actorId, String requestId);

    List<TargetEntity> initializeMonth(InitializeMonthTargetsCommand command,
                                       UUID actorId, String requestId);
}
