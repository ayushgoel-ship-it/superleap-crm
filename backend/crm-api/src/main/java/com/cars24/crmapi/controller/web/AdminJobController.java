package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.BulkImportRequest;
import com.cars24.crmapi.dto.web.request.ExportRequest;
import com.cars24.crmcore.dto.command.BulkImportCommand;
import com.cars24.crmcore.dto.command.ExportRequestCommand;
import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.service.internal.AsyncJobService;
import com.cars24.crmcore.service.internal.BulkImportService;
import com.cars24.crmcore.service.internal.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/web/v1/admin")
@Tag(name = "Admin — Jobs", description = "Bulk imports, exports, async job tracking (ADMIN only)")
public class AdminJobController extends BaseController {

    private final AsyncJobService asyncJobService;
    private final BulkImportService bulkImportService;
    private final ExportService exportService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AdminJobController(AsyncJobService asyncJobService,
                              BulkImportService bulkImportService,
                              ExportService exportService,
                              ActorScopeResolver actorScopeResolver,
                              ApiResponseBuilder responseBuilder) {
        this.asyncJobService = asyncJobService;
        this.bulkImportService = bulkImportService;
        this.exportService = exportService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @PostMapping("/imports")
    @Operation(summary = "Submit bulk import", description = "Upload CSV for async dealer-KAM mapping import")
    @ApiResponse(responseCode = "202", description = "Import job accepted")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> submitBulkImport(
            @Valid @RequestBody BulkImportRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        BulkImportCommand command = BulkImportCommand.builder()
                .csvContent(request.getCsvContent())
                .importType(request.getImportType())
                .actorId(actorId)
                .build();

        UUID jobId = bulkImportService.submitBulkImport(command, requestId);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(responseBuilder.ok(Map.of("jobId", jobId.toString())));
    }

    @PostMapping("/exports")
    @Operation(summary = "Submit export", description = "Request async CSV export of leads, dealers, calls, or visits")
    @ApiResponse(responseCode = "202", description = "Export job accepted")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> submitExport(
            @Valid @RequestBody ExportRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        ExportRequestCommand command = ExportRequestCommand.builder()
                .exportType(request.getExportType())
                .filters(request.getFilters())
                .actorId(actorId)
                .build();

        UUID jobId = exportService.submitExport(command, requestId);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(responseBuilder.ok(Map.of("jobId", jobId.toString())));
    }

    @GetMapping("/jobs/{jobId}")
    @Operation(summary = "Get job status", description = "Poll async job status and results")
    @ApiResponse(responseCode = "200", description = "Job status retrieved")
    public ResponseEntity<ApiResponseEnvelope<AsyncJobEntity>> getJobStatus(
            @PathVariable("jobId") UUID jobId) {

        actorScopeResolver.requireRole("ADMIN");
        AsyncJobEntity job = asyncJobService.getJob(jobId);
        return ResponseEntity.ok(responseBuilder.ok(job));
    }

    @GetMapping("/jobs")
    @Operation(summary = "List my jobs", description = "List all async jobs submitted by the current admin")
    @ApiResponse(responseCode = "200", description = "Jobs retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<AsyncJobEntity>>> getMyJobs() {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        List<AsyncJobEntity> jobs = asyncJobService.getJobsByUser(actorId);
        return ResponseEntity.ok(responseBuilder.ok(jobs));
    }
}
