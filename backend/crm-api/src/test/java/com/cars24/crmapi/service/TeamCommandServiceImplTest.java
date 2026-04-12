package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.CreateTeamCommand;
import com.cars24.crmcore.dto.command.UpdateTeamCommand;
import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.TeamRepository;
import com.cars24.crmcore.service.impl.TeamCommandServiceImpl;
import com.cars24.crmcore.service.internal.AuditService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamCommandServiceImplTest {

    @Mock private TeamRepository teamRepository;
    @Mock private AuditService auditService;
    private TeamCommandServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TeamCommandServiceImpl(teamRepository, auditService, new SimpleMeterRegistry());
    }

    @Test
    void createTeam_savesAndAudits() {
        CreateTeamCommand cmd = CreateTeamCommand.builder()
                .teamName("Alpha").region("North").city("Delhi").build();

        TeamEntity saved = new TeamEntity();
        saved.setTeamId(UUID.randomUUID());
        saved.setTeamName("Alpha");
        when(teamRepository.save(any())).thenReturn(saved);

        UUID actorId = UUID.randomUUID();
        TeamEntity result = service.createTeam(cmd, actorId, "req-1");

        assertThat(result.getTeamName()).isEqualTo("Alpha");
        verify(teamRepository).save(any());
        verify(auditService).log(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void updateTeam_found() {
        UUID teamId = UUID.randomUUID();
        TeamEntity existing = new TeamEntity();
        existing.setTeamId(teamId);
        existing.setTeamName("Old");
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(existing));
        when(teamRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTeamCommand cmd = UpdateTeamCommand.builder().teamName("New").build();
        TeamEntity result = service.updateTeam(teamId, cmd, UUID.randomUUID(), "req-2");

        assertThat(result.getTeamName()).isEqualTo("New");
    }

    @Test
    void updateTeam_notFound() {
        UUID teamId = UUID.randomUUID();
        when(teamRepository.findById(teamId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateTeam(teamId,
                UpdateTeamCommand.builder().build(), UUID.randomUUID(), "req-3"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
