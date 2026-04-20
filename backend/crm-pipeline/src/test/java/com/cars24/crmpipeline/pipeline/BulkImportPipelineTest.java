package com.cars24.crmpipeline.pipeline;

import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.internal.AsyncJobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BulkImportPipelineTest {

    @Mock private DealerRepository dealerRepository;
    @Mock private UserRepository userRepository;
    @Mock private AsyncJobService asyncJobService;

    private BulkImportPipeline pipeline;

    @BeforeEach
    void setUp() {
        pipeline = new BulkImportPipeline(dealerRepository, userRepository, asyncJobService);
    }

    @Test
    void process_validCsv_updatesDealer() {
        UUID jobId = UUID.randomUUID();
        UUID kamId = UUID.randomUUID();

        AsyncJobEntity runningJob = new AsyncJobEntity();
        runningJob.setJobId(jobId);
        runningJob.setStatus("RUNNING");
        when(asyncJobService.markRunning(jobId)).thenReturn(runningJob);

        DealerEntity dealer = new DealerEntity();
        dealer.setDealerCode("DLR-001");
        when(dealerRepository.findByDealerCode("DLR-001")).thenReturn(Optional.of(dealer));
        when(dealerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserEntity user = new UserEntity();
        user.setUserId(kamId);
        when(userRepository.findById(kamId)).thenReturn(Optional.of(user));

        String csv = "dealer_code,kam_user_id\nDLR-001," + kamId;

        pipeline.process(jobId, csv);

        verify(asyncJobService).markRunning(jobId);
        verify(dealerRepository).save(argThat(d -> kamId.equals(d.getKamId())));
        verify(asyncJobService).markCompleted(eq(jobId), argThat(s ->
                s.contains("\"successCount\":1") && s.contains("\"errorCount\":0")));
    }

    @Test
    void process_dealerNotFound_recordsError() {
        UUID jobId = UUID.randomUUID();
        UUID kamId = UUID.randomUUID();

        AsyncJobEntity runningJob = new AsyncJobEntity();
        runningJob.setJobId(jobId);
        when(asyncJobService.markRunning(jobId)).thenReturn(runningJob);

        when(dealerRepository.findByDealerCode("INVALID")).thenReturn(Optional.empty());

        String csv = "dealer_code,kam_user_id\nINVALID," + kamId;

        pipeline.process(jobId, csv);

        verify(dealerRepository, never()).save(any());
        verify(asyncJobService).markCompleted(eq(jobId), argThat(s ->
                s.contains("\"successCount\":0") && s.contains("\"errorCount\":1")));
    }

    @Test
    void process_mixedResults_reportsCorrectCounts() {
        UUID jobId = UUID.randomUUID();
        UUID kamId = UUID.randomUUID();

        AsyncJobEntity runningJob = new AsyncJobEntity();
        runningJob.setJobId(jobId);
        when(asyncJobService.markRunning(jobId)).thenReturn(runningJob);

        DealerEntity dealer = new DealerEntity();
        dealer.setDealerCode("DLR-001");
        when(dealerRepository.findByDealerCode("DLR-001")).thenReturn(Optional.of(dealer));
        when(dealerRepository.findByDealerCode("DLR-BAD")).thenReturn(Optional.empty());
        when(dealerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserEntity user = new UserEntity();
        user.setUserId(kamId);
        when(userRepository.findById(kamId)).thenReturn(Optional.of(user));

        String csv = "dealer_code,kam_user_id\nDLR-001," + kamId + "\nDLR-BAD," + kamId;

        pipeline.process(jobId, csv);

        verify(asyncJobService).markCompleted(eq(jobId), argThat(s ->
                s.contains("\"totalRows\":2") &&
                s.contains("\"successCount\":1") &&
                s.contains("\"errorCount\":1")));
    }
}
