package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.HierarchyDryRunResult;
import com.cars24.crmcore.dto.command.HierarchyChangeCommand;

import java.util.UUID;

public interface HierarchyCommandService {

    HierarchyDryRunResult dryRun(HierarchyChangeCommand command);

    HierarchyDryRunResult apply(HierarchyChangeCommand command, UUID actorId, String requestId);
}
