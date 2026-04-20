package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.CacheConfig;
import com.cars24.crmcore.dto.OrgHierarchyDto;
import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.repository.postgres.TeamRepository;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.internal.OrgQueryService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrgQueryServiceImpl implements OrgQueryService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public OrgQueryServiceImpl(TeamRepository teamRepository, UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Cacheable(CacheConfig.CACHE_ORG_HIERARCHY)
    public OrgHierarchyDto getOrgHierarchy() {
        List<TeamEntity> allTeams = teamRepository.findAll();
        List<UserEntity> allUsers = userRepository.findByActiveTrue();

        Map<String, List<TeamEntity>> teamsByRegion = allTeams.stream()
                .collect(Collectors.groupingBy(t -> t.getRegion() != null ? t.getRegion() : "Unknown"));

        Map<java.util.UUID, List<UserEntity>> usersByTeam = allUsers.stream()
                .filter(u -> u.getTeamId() != null)
                .collect(Collectors.groupingBy(UserEntity::getTeamId));

        List<OrgHierarchyDto.RegionDto> regions = teamsByRegion.entrySet().stream()
                .map(entry -> OrgHierarchyDto.RegionDto.builder()
                        .region(entry.getKey())
                        .teams(entry.getValue().stream()
                                .map(team -> OrgHierarchyDto.TeamDto.builder()
                                        .teamId(team.getTeamId())
                                        .teamName(team.getTeamName())
                                        .tlUserId(team.getTlUserId())
                                        .tlName(findUserName(allUsers, team.getTlUserId()))
                                        .kams(usersByTeam.getOrDefault(team.getTeamId(), List.of()).stream()
                                                .map(u -> OrgHierarchyDto.UserSummary.builder()
                                                        .userId(u.getUserId())
                                                        .name(u.getName())
                                                        .role(u.getRole())
                                                        .city(u.getCity())
                                                        .build())
                                                .toList())
                                        .build())
                                .toList())
                        .build())
                .toList();

        return OrgHierarchyDto.builder().regions(regions).build();
    }

    private String findUserName(List<UserEntity> users, java.util.UUID userId) {
        if (userId == null) return null;
        return users.stream()
                .filter(u -> userId.equals(u.getUserId()))
                .map(UserEntity::getName)
                .findFirst()
                .orElse(null);
    }
}
