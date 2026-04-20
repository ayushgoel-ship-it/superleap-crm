package com.cars24.crmcore.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.UUID;

@Value
@Builder
public class HierarchyDryRunResult {

    List<HierarchyChangePreview> previews;
    int totalChanges;

    @Value
    @Builder
    public static class HierarchyChangePreview {
        UUID userId;
        String userName;
        UUID oldTeamId;
        UUID newTeamId;
        String oldRole;
        String newRole;
        int affectedDealerCount;
    }
}
