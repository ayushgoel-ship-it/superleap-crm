package com.cars24.crmapi.service;

import com.cars24.crmcore.entity.TargetEntity;
import com.cars24.crmcore.repository.postgres.TargetRepository;
import com.cars24.crmcore.service.impl.TargetQueryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TargetQueryServiceImplTest {

    @Mock private TargetRepository targetRepository;
    @InjectMocks private TargetQueryServiceImpl service;

    @Test
    void listByPeriod() {
        TargetEntity t = new TargetEntity();
        t.setPeriod("2026-04");
        when(targetRepository.findByPeriod("2026-04")).thenReturn(List.of(t));

        List<TargetEntity> result = service.listByPeriod("2026-04");
        assertThat(result).hasSize(1);
    }

    @Test
    void listByTeamAndPeriod() {
        TargetEntity t = new TargetEntity();
        t.setPeriod("2026-04");
        when(targetRepository.findByTeamIdAndPeriod("team-1", "2026-04")).thenReturn(List.of(t));

        List<TargetEntity> result = service.listByTeamAndPeriod("team-1", "2026-04");
        assertThat(result).hasSize(1);
    }
}
