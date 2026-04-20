package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.HierarchyDryRunResult;
import com.cars24.crmcore.dto.command.HierarchyChangeCommand;
import com.cars24.crmcore.dto.command.HierarchyChangeCommand.HierarchyAssignment;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.repository.postgres.TeamRepository;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.impl.HierarchyCommandServiceImpl;
import com.cars24.crmcore.service.internal.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HierarchyCommandServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private DealerRepository dealerRepository;
    @Mock private AuditService auditService;

    private HierarchyCommandServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new HierarchyCommandServiceImpl(userRepository, teamRepository, dealerRepository, auditService);
    }

    @Test
    void dryRun_returnsPreviewWithAffectedDealers() {
        UUID userId = UUID.randomUUID();
        UUID oldTeamId = UUID.randomUUID();
        UUID newTeamId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setUserId(userId);
        user.setName("Test KAM");
        user.setRole("KAM");
        user.setTeamId(oldTeamId);

        TeamEntity newTeam = new TeamEntity();
        newTeam.setTeamId(newTeamId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(teamRepository.findById(newTeamId)).thenReturn(Optional.of(newTeam));
        when(dealerRepository.findByKamId(userId)).thenReturn(List.of(new DealerEntity(), new DealerEntity()));

        HierarchyChangeCommand command = HierarchyChangeCommand.builder()
                .assignments(List.of(HierarchyAssignment.builder()
                        .userId(userId)
                        .newTeamId(newTeamId)
                        .newRole("TL")
                        .build()))
                .build();

        HierarchyDryRunResult result = service.dryRun(command);

        assertThat(result.getTotalChanges()).isEqualTo(1);
        assertThat(result.getPreviews()).hasSize(1);
        assertThat(result.getPreviews().get(0).getOldRole()).isEqualTo("KAM");
        assertThat(result.getPreviews().get(0).getNewRole()).isEqualTo("TL");
        assertThat(result.getPreviews().get(0).getAffectedDealerCount()).isEqualTo(2);
    }

    @Test
    void dryRun_userNotFound_throwsResourceNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        HierarchyChangeCommand command = HierarchyChangeCommand.builder()
                .assignments(List.of(HierarchyAssignment.builder()
                        .userId(userId)
                        .build()))
                .build();

        assertThatThrownBy(() -> service.dryRun(command))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void apply_updatesUserAndAudits() {
        UUID userId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID oldTeamId = UUID.randomUUID();
        UUID newTeamId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setUserId(userId);
        user.setName("Test KAM");
        user.setRole("KAM");
        user.setTeamId(oldTeamId);

        TeamEntity newTeam = new TeamEntity();
        newTeam.setTeamId(newTeamId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(teamRepository.findById(newTeamId)).thenReturn(Optional.of(newTeam));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(dealerRepository.findByKamId(userId)).thenReturn(List.of());

        HierarchyChangeCommand command = HierarchyChangeCommand.builder()
                .assignments(List.of(HierarchyAssignment.builder()
                        .userId(userId)
                        .newTeamId(newTeamId)
                        .newRole("TL")
                        .build()))
                .build();

        HierarchyDryRunResult result = service.apply(command, actorId, "req-hier");

        assertThat(result.getTotalChanges()).isEqualTo(1);
        assertThat(user.getRole()).isEqualTo("TL");
        assertThat(user.getTeamId()).isEqualTo(newTeamId);
        assertThat(user.getUpdatedAt()).isNotNull();

        verify(userRepository).save(user);
        verify(auditService).log(eq(actorId), eq("ADMIN"), eq("HIERARCHY_CHANGE"),
                eq("users"), eq(userId.toString()), isNull(), isNull(), anyString(), eq("req-hier"));
    }

    @Test
    void apply_tlMovesTeam_unlinksDealers() {
        UUID userId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID oldTeamId = UUID.randomUUID();
        UUID newTeamId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setUserId(userId);
        user.setName("Test TL");
        user.setRole("TL");
        user.setTeamId(oldTeamId);

        TeamEntity newTeam = new TeamEntity();
        newTeam.setTeamId(newTeamId);

        DealerEntity dealer1 = new DealerEntity();
        dealer1.setDealerId(UUID.randomUUID());
        dealer1.setTlId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(teamRepository.findById(newTeamId)).thenReturn(Optional.of(newTeam));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(dealerRepository.findByTlId(userId)).thenReturn(List.of(dealer1));
        when(dealerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        HierarchyChangeCommand command = HierarchyChangeCommand.builder()
                .assignments(List.of(HierarchyAssignment.builder()
                        .userId(userId)
                        .newTeamId(newTeamId)
                        .build()))
                .build();

        service.apply(command, actorId, "req-tl-move");

        assertThat(dealer1.getTlId()).isNull();
        assertThat(dealer1.getUpdatedAt()).isNotNull();
        verify(dealerRepository).save(dealer1);
    }
}
