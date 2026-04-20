package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.CacheConfig;
import com.cars24.crmcore.dto.HierarchyDryRunResult;
import com.cars24.crmcore.dto.HierarchyDryRunResult.HierarchyChangePreview;
import com.cars24.crmcore.dto.command.HierarchyChangeCommand;
import com.cars24.crmcore.dto.command.HierarchyChangeCommand.HierarchyAssignment;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.repository.postgres.TeamRepository;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.HierarchyCommandService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class HierarchyCommandServiceImpl implements HierarchyCommandService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final DealerRepository dealerRepository;
    private final AuditService auditService;

    public HierarchyCommandServiceImpl(UserRepository userRepository,
                                        TeamRepository teamRepository,
                                        DealerRepository dealerRepository,
                                        AuditService auditService) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.dealerRepository = dealerRepository;
        this.auditService = auditService;
    }

    @Override
    public HierarchyDryRunResult dryRun(HierarchyChangeCommand command) {
        List<HierarchyChangePreview> previews = new ArrayList<>();

        for (HierarchyAssignment assignment : command.getAssignments()) {
            UserEntity user = userRepository.findById(assignment.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found: " + assignment.getUserId()));

            if (assignment.getNewTeamId() != null) {
                teamRepository.findById(assignment.getNewTeamId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Team not found: " + assignment.getNewTeamId()));
            }

            int affectedDealerCount = computeAffectedDealerCount(user);

            previews.add(HierarchyChangePreview.builder()
                    .userId(user.getUserId())
                    .userName(user.getName())
                    .oldTeamId(user.getTeamId())
                    .newTeamId(assignment.getNewTeamId() != null ? assignment.getNewTeamId() : user.getTeamId())
                    .oldRole(user.getRole())
                    .newRole(assignment.getNewRole() != null ? assignment.getNewRole() : user.getRole())
                    .affectedDealerCount(affectedDealerCount)
                    .build());
        }

        return HierarchyDryRunResult.builder()
                .previews(previews)
                .totalChanges(previews.size())
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_ORG_HIERARCHY, allEntries = true)
    public HierarchyDryRunResult apply(HierarchyChangeCommand command, UUID actorId, String requestId) {
        List<HierarchyChangePreview> previews = new ArrayList<>();

        for (HierarchyAssignment assignment : command.getAssignments()) {
            UserEntity user = userRepository.findById(assignment.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found: " + assignment.getUserId()));

            if (assignment.getNewTeamId() != null) {
                teamRepository.findById(assignment.getNewTeamId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Team not found: " + assignment.getNewTeamId()));
            }

            String oldRole = user.getRole();
            UUID oldTeamId = user.getTeamId();
            int affectedDealerCount = computeAffectedDealerCount(user);

            // Apply user changes
            if (assignment.getNewTeamId() != null) {
                user.setTeamId(assignment.getNewTeamId());
            }
            if (assignment.getNewRole() != null) {
                user.setRole(assignment.getNewRole());
            }
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);

            // Re-assign dealers if KAM or TL changed teams
            if (assignment.getNewTeamId() != null && !assignment.getNewTeamId().equals(oldTeamId)) {
                reassignDealers(user, oldTeamId);
            }

            previews.add(HierarchyChangePreview.builder()
                    .userId(user.getUserId())
                    .userName(user.getName())
                    .oldTeamId(oldTeamId)
                    .newTeamId(user.getTeamId())
                    .oldRole(oldRole)
                    .newRole(user.getRole())
                    .affectedDealerCount(affectedDealerCount)
                    .build());

            auditService.log(actorId, "ADMIN", "HIERARCHY_CHANGE",
                    "users", user.getUserId().toString(), null, null,
                    "Hierarchy change: role " + oldRole + " -> " + user.getRole() +
                            ", team " + oldTeamId + " -> " + user.getTeamId(),
                    requestId);
        }

        return HierarchyDryRunResult.builder()
                .previews(previews)
                .totalChanges(previews.size())
                .build();
    }

    private int computeAffectedDealerCount(UserEntity user) {
        if ("KAM".equals(user.getRole())) {
            return dealerRepository.findByKamId(user.getUserId()).size();
        } else if ("TL".equals(user.getRole())) {
            return dealerRepository.findByTlId(user.getUserId()).size();
        }
        return 0;
    }

    private void reassignDealers(UserEntity user, UUID oldTeamId) {
        // When a KAM moves teams, their dealers stay assigned to them (KAM follows dealers).
        // When a TL moves teams, dealers under the old TL need to be unlinked.
        if ("TL".equals(user.getRole())) {
            List<DealerEntity> dealers = dealerRepository.findByTlId(user.getUserId());
            for (DealerEntity dealer : dealers) {
                dealer.setTlId(null);
                dealer.setUpdatedAt(Instant.now());
                dealerRepository.save(dealer);
            }
        }
    }
}
