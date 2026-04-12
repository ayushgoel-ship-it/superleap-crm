package com.cars24.crmapi.scheduler;

import com.cars24.crmcore.entity.TargetEntity;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.repository.postgres.TargetRepository;
import com.cars24.crmcore.repository.postgres.UserRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MonthlyTargetInitTaskTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TargetRepository targetRepository;

    private MonthlyTargetInitTask task;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        task = new MonthlyTargetInitTask(userRepository, targetRepository, new SimpleMeterRegistry());
    }

    @Test
    void initializeMonthlyTargets_createsTargetsForActiveKams() {
        when(targetRepository.findByPeriod(any())).thenReturn(Collections.emptyList());

        UserEntity kam = new UserEntity();
        kam.setUserId(UUID.randomUUID());
        kam.setName("Test KAM");
        kam.setRole("KAM");
        kam.setTeamId(UUID.randomUUID());

        UserEntity tl = new UserEntity();
        tl.setUserId(UUID.randomUUID());
        tl.setName("Test TL");
        tl.setRole("TL");

        when(userRepository.findByActiveTrue()).thenReturn(List.of(kam, tl));
        when(targetRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        task.initializeMonthlyTargets();

        ArgumentCaptor<TargetEntity> captor = ArgumentCaptor.forClass(TargetEntity.class);
        verify(targetRepository, times(1)).save(captor.capture());
        TargetEntity saved = captor.getValue();
        assertThat(saved.getUserName()).isEqualTo("Test KAM");
        assertThat(saved.getRole()).isEqualTo("KAM");
        assertThat(saved.getSiTarget()).isZero();
    }

    @Test
    void initializeMonthlyTargets_skipsIfTargetsExist() {
        TargetEntity existing = new TargetEntity();
        when(targetRepository.findByPeriod(any())).thenReturn(List.of(existing));

        task.initializeMonthlyTargets();

        verify(userRepository, never()).findByActiveTrue();
        verify(targetRepository, never()).save(any());
    }

    @Test
    void initializeMonthlyTargets_noActiveUsers_noSaves() {
        when(targetRepository.findByPeriod(any())).thenReturn(Collections.emptyList());
        when(userRepository.findByActiveTrue()).thenReturn(Collections.emptyList());

        task.initializeMonthlyTargets();

        verify(targetRepository, never()).save(any());
    }
}
