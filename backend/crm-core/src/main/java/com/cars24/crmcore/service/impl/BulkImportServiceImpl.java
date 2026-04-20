package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.command.BulkImportCommand;
import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.service.internal.AsyncJobService;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.BulkImportService;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class BulkImportServiceImpl implements BulkImportService {

    private final AsyncJobService asyncJobService;
    private final AuditService auditService;
    private final ApplicationContext applicationContext;

    public BulkImportServiceImpl(AsyncJobService asyncJobService,
                                  AuditService auditService,
                                  ApplicationContext applicationContext) {
        this.asyncJobService = asyncJobService;
        this.auditService = auditService;
        this.applicationContext = applicationContext;
    }

    @Override
    public UUID submitBulkImport(BulkImportCommand command, String requestId) {
        String inputPayload = String.format("{\"importType\":\"%s\"}", command.getImportType());

        AsyncJobEntity job = asyncJobService.createJob("BULK_IMPORT", inputPayload, command.getActorId());

        auditService.log(command.getActorId(), "ADMIN", "BULK_IMPORT_SUBMIT",
                "async_jobs", job.getJobId().toString(), null, null,
                "Bulk import submitted: " + command.getImportType(),
                requestId);

        // Trigger async processing via ApplicationContext to ensure @Async proxy is used
        try {
            Object pipeline = applicationContext.getBean("bulkImportPipeline");
            pipeline.getClass().getMethod("process", UUID.class, String.class)
                    .invoke(pipeline, job.getJobId(), command.getCsvContent());
        } catch (Exception e) {
            asyncJobService.markFailed(job.getJobId(), "Failed to start pipeline: " + e.getMessage());
        }

        return job.getJobId();
    }
}
