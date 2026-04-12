package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.ExportRequestCommand;
import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.service.impl.ExportServiceImpl;
import com.cars24.crmcore.service.internal.AsyncJobService;
import com.cars24.crmcore.service.internal.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportServiceImplTest {

    @Mock private AsyncJobService asyncJobService;
    @Mock private AuditService auditService;
    @Mock private ApplicationContext applicationContext;

    private ExportServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ExportServiceImpl(asyncJobService, auditService, applicationContext);
    }

    @Test
    void submitExport_createsJobAndReturnsId() {
        UUID actorId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();

        AsyncJobEntity job = new AsyncJobEntity();
        job.setJobId(jobId);
        job.setJobType("EXPORT");
        job.setStatus("PENDING");

        when(asyncJobService.createJob(eq("EXPORT"), anyString(), eq(actorId)))
                .thenReturn(job);

        // Pipeline bean lookup will fail gracefully in test
        when(applicationContext.getBean("exportPipeline"))
                .thenThrow(new RuntimeException("No bean in test"));

        ExportRequestCommand command = ExportRequestCommand.builder()
                .exportType("dealers")
                .filters(Map.of("region", "North"))
                .actorId(actorId)
                .build();

        UUID result = service.submitExport(command, "req-export");

        assertThat(result).isEqualTo(jobId);
        verify(asyncJobService).createJob(eq("EXPORT"), anyString(), eq(actorId));
        verify(auditService).log(eq(actorId), eq("ADMIN"), eq("EXPORT_REQUEST"),
                eq("async_jobs"), eq(jobId.toString()), isNull(), isNull(), anyString(), eq("req-export"));
    }
}
