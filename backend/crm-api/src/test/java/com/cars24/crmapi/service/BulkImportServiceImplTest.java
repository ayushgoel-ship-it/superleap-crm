package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.BulkImportCommand;
import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.service.impl.BulkImportServiceImpl;
import com.cars24.crmcore.service.internal.AsyncJobService;
import com.cars24.crmcore.service.internal.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BulkImportServiceImplTest {

    @Mock private AsyncJobService asyncJobService;
    @Mock private AuditService auditService;
    @Mock private ApplicationContext applicationContext;

    private BulkImportServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new BulkImportServiceImpl(asyncJobService, auditService, applicationContext);
    }

    @Test
    void submitBulkImport_createsJobAndReturnsId() {
        UUID actorId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();

        AsyncJobEntity job = new AsyncJobEntity();
        job.setJobId(jobId);
        job.setJobType("BULK_IMPORT");
        job.setStatus("PENDING");

        when(asyncJobService.createJob(eq("BULK_IMPORT"), anyString(), eq(actorId)))
                .thenReturn(job);

        // Pipeline bean lookup will fail gracefully in test (no real bean)
        when(applicationContext.getBean("bulkImportPipeline"))
                .thenThrow(new RuntimeException("No bean in test"));

        BulkImportCommand command = BulkImportCommand.builder()
                .csvContent("dealer_code,kam_user_id\nDLR-001,some-uuid")
                .importType("dealer_kam_mapping")
                .actorId(actorId)
                .build();

        UUID result = service.submitBulkImport(command, "req-import");

        assertThat(result).isEqualTo(jobId);
        verify(asyncJobService).createJob(eq("BULK_IMPORT"), anyString(), eq(actorId));
        verify(auditService).log(eq(actorId), eq("ADMIN"), eq("BULK_IMPORT_SUBMIT"),
                eq("async_jobs"), eq(jobId.toString()), isNull(), isNull(), anyString(), eq("req-import"));
    }
}
