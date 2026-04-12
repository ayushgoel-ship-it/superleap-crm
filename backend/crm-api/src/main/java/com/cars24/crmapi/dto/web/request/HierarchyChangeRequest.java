package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HierarchyChangeRequest {

    @NotEmpty
    @Valid
    private List<HierarchyAssignmentRequest> assignments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HierarchyAssignmentRequest {

        @JsonProperty("user_id")
        private UUID userId;

        @JsonProperty("new_team_id")
        private UUID newTeamId;

        @JsonProperty("new_role")
        private String newRole;
    }
}
