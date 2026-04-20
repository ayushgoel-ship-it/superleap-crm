package com.cars24.crmapi.scheduler;

import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.repository.postgres.AsyncJobRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class StaleJobCleanupTaskTest {

    @Mock
    private AsyncJobRepository asyncJobRepository;

    private StaleJobCleanupTask task;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        task = new StaleJobCleanupTask(asyncJobRepository, new SimpleMeterRegistry());
    }

    @Test
    void failStaleJobs_marksStuckRunningJobAsFailed() {
        AsyncJobEntity stuckJob = new AsyncJobEntity();
        stuckJob.setStatus("RUNNING");
        stuckJob.setStartedAt(Instant.now().minus(3, ChronoUnit.HOURS));

        when(asyncJobRepository.findByJobTypeAndStatus(any(), eq("PENDING"))).thenReturn(Collections.emptyList());
        when(asyncJobRepository.findByJobTypeAndStatus(any(), eq("RUNNING"))).thenReturn(List.of(stuckJob));
        when(asyncJobRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        task.failStaleJobs();

        ArgumentCaptor<AsyncJobEntity> captor = ArgumentCaptor.forClass(AsyncJobEntity.class);
        verify(asyncJobRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("FAILED");
        assertThat(captor.getValue().getErrorMessage()).contains("cleanup task");
    }

    @Test
    void failStaleJobs_skipsRecentJobs() {
        AsyncJobEntity recentJob = new AsyncJobEntity();
        recentJob.setStatus("RUNNING");
        recentJob.setStartedAt(Instant.now().minus(30, ChronoUnit.MINUTES));

        when(asyncJobRepository.findByJobTypeAndStatus(any(), eq("PENDING"))).thenReturn(Collections.emptyList());
        when(asyncJobRepository.findByJobTypeAndStatus(any(), eq("RUNNING"))).thenReturn(List.of(recentJob));

        task.failStaleJobs();

        verify(asyncJobRepository, never()).save(any());
    }

    @Test
    void failStaleJobs_noStaleJobs_noSaves() {
        when(asyncJobRepository.findByJobTypeAndStatus(any(), any())).thenReturn(Collections.emptyList());

        task.failStaleJobs();

        verify(asyncJobRepository, never()).save(any());
    }
}
