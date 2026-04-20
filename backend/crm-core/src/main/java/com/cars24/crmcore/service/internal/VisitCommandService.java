package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.CompleteVisitCommand;
import com.cars24.crmcore.dto.command.StartVisitCommand;
import com.cars24.crmcore.entity.VisitEntity;

import java.util.UUID;

public interface VisitCommandService {

    VisitEntity startVisit(StartVisitCommand command, String requestId);

    VisitEntity completeVisit(UUID visitId, CompleteVisitCommand command,
                              UUID actorId, String actorRole, String requestId);
}
