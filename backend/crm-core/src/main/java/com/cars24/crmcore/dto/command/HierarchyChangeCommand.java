package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.UUID;

@Value
@Builder
public class HierarchyChangeCommand {

    List<HierarchyAssignment> assignments;

    @Value
    @Builder
    public static class HierarchyAssignment {
        UUID userId;
        UUID newTeamId;
        String newRole;
    }
}
