package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.command.ExportRequestCommand;
import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.service.internal.AsyncJobService;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.ExportService;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ExportServiceImpl implements ExportService {

    private final AsyncJobService asyncJobService;
    private final AuditService auditService;
    private final ApplicationContext applicationContext;

    public ExportServiceImpl(AsyncJobService asyncJobService,
                              AuditService auditService,
                              ApplicationContext applicationContext) {
        this.asyncJobService = asyncJobService;
        this.auditService = auditService;
        this.applicationContext = applicationContext;
    }

    @Override
    public UUID submitExport(ExportRequestCommand command, String requestId) {
        String inputPayload = String.format("{\"exportType\":\"%s\"}", command.getExportType());

        AsyncJobEntity job = asyncJobService.createJob("EXPORT", inputPayload, command.getActorId());

        auditService.log(command.getActorId(), "ADMIN", "EXPORT_REQUEST",
                "async_jobs", job.getJobId().toString(), null, null,
                "Export requested: " + command.getExportType(),
                requestId);

        // Trigger async processing via ApplicationContext to ensure @Async proxy is used
        try {
            Object pipeline = applicationContext.getBean("exportPipeline");
            pipeline.getClass().getMethod("generate", UUID.class, String.class)
                    .invoke(pipeline, job.getJobId(), command.getExportType());
        } catch (Exception e) {
            asyncJobService.markFailed(job.getJobId(), "Failed to start export: " + e.getMessage());
        }

        return job.getJobId();
    }
}
