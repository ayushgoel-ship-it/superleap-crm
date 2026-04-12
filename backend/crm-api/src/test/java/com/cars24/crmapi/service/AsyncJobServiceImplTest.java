package com.cars24.crmapi.service;

import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.AsyncJobRepository;
import com.cars24.crmcore.service.impl.AsyncJobServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AsyncJobServiceImplTest {

    @Mock private AsyncJobRepository asyncJobRepository;

    private AsyncJobServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AsyncJobServiceImpl(asyncJobRepository);
    }

    @Test
    void createJob_setsDefaultsAndSaves() {
        UUID createdBy = UUID.randomUUID();

        when(asyncJobRepository.save(any())).thenAnswer(inv -> {
            AsyncJobEntity e = inv.getArgument(0);
            e.setJobId(UUID.randomUUID());
            return e;
        });

        AsyncJobEntity result = service.createJob("BULK_IMPORT", "{\"file\":\"test.csv\"}", createdBy);

        assertThat(result.getJobType()).isEqualTo("BULK_IMPORT");
        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(result.getInputPayload()).isEqualTo("{\"file\":\"test.csv\"}");
        assertThat(result.getCreatedBy()).isEqualTo(createdBy);
        assertThat(result.getCreatedAt()).isNotNull();
        assertThat(result.getJobId()).isNotNull();
    }

    @Test
    void markRunning_updatesStatusAndStartedAt() {
        UUID jobId = UUID.randomUUID();
        AsyncJobEntity existing = new AsyncJobEntity();
        existing.setJobId(jobId);
        existing.setStatus("PENDING");

        when(asyncJobRepository.findById(jobId)).thenReturn(Optional.of(existing));
        when(asyncJobRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AsyncJobEntity result = service.markRunning(jobId);

        assertThat(result.getStatus()).isEqualTo("RUNNING");
        assertThat(result.getStartedAt()).isNotNull();
    }

    @Test
    void markCompleted_updatesStatusAndResult() {
        UUID jobId = UUID.randomUUID();
        AsyncJobEntity existing = new AsyncJobEntity();
        existing.setJobId(jobId);
        existing.setStatus("RUNNING");

        when(asyncJobRepository.findById(jobId)).thenReturn(Optional.of(existing));
        when(asyncJobRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AsyncJobEntity result = service.markCompleted(jobId, "{\"rows\":100,\"errors\":2}");

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getResultSummary()).isEqualTo("{\"rows\":100,\"errors\":2}");
        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    void markFailed_updatesStatusAndError() {
        UUID jobId = UUID.randomUUID();
        AsyncJobEntity existing = new AsyncJobEntity();
        existing.setJobId(jobId);
        existing.setStatus("RUNNING");

        when(asyncJobRepository.findById(jobId)).thenReturn(Optional.of(existing));
        when(asyncJobRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AsyncJobEntity result = service.markFailed(jobId, "CSV parse error at row 42");

        assertThat(result.getStatus()).isEqualTo("FAILED");
        assertThat(result.getErrorMessage()).isEqualTo("CSV parse error at row 42");
        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    void getJob_notFound_throwsResourceNotFound() {
        UUID jobId = UUID.randomUUID();
        when(asyncJobRepository.findById(jobId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getJob(jobId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(jobId.toString());
    }

    @Test
    void getJobsByUser_delegatesToRepository() {
        UUID userId = UUID.randomUUID();
        AsyncJobEntity job1 = new AsyncJobEntity();
        job1.setJobId(UUID.randomUUID());
        job1.setJobType("EXPORT");

        when(asyncJobRepository.findByCreatedByOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(job1));

        List<AsyncJobEntity> results = service.getJobsByUser(userId);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getJobType()).isEqualTo("EXPORT");
        verify(asyncJobRepository).findByCreatedByOrderByCreatedAtDesc(userId);
    }
}
