package com.cars24.crmapi.service;

import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.TeamRepository;
import com.cars24.crmcore.service.impl.TeamQueryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamQueryServiceImplTest {

    @Mock private TeamRepository teamRepository;
    @InjectMocks private TeamQueryServiceImpl service;

    @Test
    void listTeams_all() {
        when(teamRepository.findAll()).thenReturn(List.of(new TeamEntity()));
        assertThat(service.listTeams(null)).hasSize(1);
    }

    @Test
    void listTeams_byRegion() {
        when(teamRepository.findByRegion("North")).thenReturn(List.of(new TeamEntity()));
        assertThat(service.listTeams("North")).hasSize(1);
    }

    @Test
    void getTeamDetail_found() {
        UUID teamId = UUID.randomUUID();
        TeamEntity t = new TeamEntity();
        t.setTeamId(teamId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(t));
        assertThat(service.getTeamDetail(teamId).getTeamId()).isEqualTo(teamId);
    }

    @Test
    void getTeamDetail_notFound() {
        UUID teamId = UUID.randomUUID();
        when(teamRepository.findById(teamId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getTeamDetail(teamId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
