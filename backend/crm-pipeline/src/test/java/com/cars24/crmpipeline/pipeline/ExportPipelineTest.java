package com.cars24.crmpipeline.pipeline;

import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.repository.postgres.LeadRepository;
import com.cars24.crmcore.service.internal.AsyncJobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportPipelineTest {

    @Mock private DealerRepository dealerRepository;
    @Mock private LeadRepository leadRepository;
    @Mock private AsyncJobService asyncJobService;

    private ExportPipeline pipeline;

    @BeforeEach
    void setUp() {
        pipeline = new ExportPipeline(dealerRepository, leadRepository, asyncJobService);
    }

    @Test
    void generate_dealers_producesCsvAndCompletes() {
        UUID jobId = UUID.randomUUID();

        AsyncJobEntity runningJob = new AsyncJobEntity();
        runningJob.setJobId(jobId);
        when(asyncJobService.markRunning(jobId)).thenReturn(runningJob);

        DealerEntity dealer = new DealerEntity();
        dealer.setDealerCode("DLR-001");
        dealer.setDealerName("Test Dealer");
        dealer.setCity("Delhi");
        dealer.setRegion("North");
        dealer.setSegment("Gold");
        dealer.setStatus("active");

        when(dealerRepository.findAll()).thenReturn(List.of(dealer));

        pipeline.generate(jobId, "dealers");

        verify(asyncJobService).markRunning(jobId);
        verify(asyncJobService).markCompleted(eq(jobId), argThat(s ->
                s.contains("\"exportType\":\"dealers\"") &&
                s.contains("\"rowCount\":1")));
    }

    @Test
    void generate_leads_producesCsvAndCompletes() {
        UUID jobId = UUID.randomUUID();

        AsyncJobEntity runningJob = new AsyncJobEntity();
        runningJob.setJobId(jobId);
        when(asyncJobService.markRunning(jobId)).thenReturn(runningJob);

        LeadEntity lead = new LeadEntity();
        lead.setLeadId("LEAD-001");
        lead.setDealerCode("DLR-001");
        lead.setCustomerName("John Doe");
        lead.setCustomerPhone("9876543210");
        lead.setStatus("open");
        lead.setStage("new");
        lead.setChannel("online");

        when(leadRepository.findAll()).thenReturn(List.of(lead));

        pipeline.generate(jobId, "leads");

        verify(asyncJobService).markCompleted(eq(jobId), argThat(s ->
                s.contains("\"exportType\":\"leads\"") &&
                s.contains("\"rowCount\":1")));
    }

    @Test
    void generate_unsupportedType_failsJob() {
        UUID jobId = UUID.randomUUID();

        AsyncJobEntity runningJob = new AsyncJobEntity();
        runningJob.setJobId(jobId);
        when(asyncJobService.markRunning(jobId)).thenReturn(runningJob);

        pipeline.generate(jobId, "unknown_type");

        verify(asyncJobService).markFailed(eq(jobId), argThat(s ->
                s.contains("Unsupported export type")));
    }
}
