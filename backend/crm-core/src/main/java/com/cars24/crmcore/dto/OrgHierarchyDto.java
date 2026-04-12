package com.cars24.crmcore.dto;

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
public class OrgHierarchyDto {

    private List<RegionDto> regions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegionDto {
        private String region;
        private List<TeamDto> teams;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamDto {
        private UUID teamId;
        private String teamName;
        private String tlName;
        private UUID tlUserId;
        private List<UserSummary> kams;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private UUID userId;
        private String name;
        private String role;
        private String city;
    }
}
