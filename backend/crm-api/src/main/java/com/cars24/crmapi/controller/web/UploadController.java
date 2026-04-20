package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.InitiateUploadRequest;
import com.cars24.crmcore.service.internal.UploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/web/v1/uploads")
@Tag(name = "Uploads", description = "File uploads — presigned URLs, list, download, delete")
public class UploadController extends BaseController {

    private final UploadService uploadService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public UploadController(UploadService uploadService,
                            ActorScopeResolver actorScopeResolver,
                            ApiResponseBuilder responseBuilder) {
        this.uploadService = uploadService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @PostMapping("/initiate")
    @Operation(summary = "Initiate upload", description = "Get a presigned URL for uploading a file")
    @ApiResponse(responseCode = "201", description = "Upload initiated")
    public ResponseEntity<ApiResponseEnvelope<Map<String, Object>>> initiateUpload(
            @Valid @RequestBody InitiateUploadRequest request) {

        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();

        UploadService.UploadInitiation initiation = uploadService.initiateUpload(
                request.getEntityType(),
                request.getEntityId(),
                request.getFileName(),
                request.getContentType(),
                request.getSizeBytes(),
                actorId);

        Map<String, Object> result = Map.of(
                "uploadId", initiation.uploadId(),
                "uploadUrl", initiation.uploadUrl().toString(),
                "storageKey", initiation.storageKey());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(result));
    }

    @GetMapping("/{uploadId}/download")
    @Operation(summary = "Get download URL", description = "Get a presigned download URL for an uploaded file")
    @ApiResponse(responseCode = "200", description = "Download URL generated")
    public ResponseEntity<ApiResponseEnvelope<Map<String, String>>> getDownloadUrl(
            @PathVariable("uploadId") UUID uploadId) {

        URL downloadUrl = uploadService.getDownloadUrl(uploadId);

        return ResponseEntity.ok(responseBuilder.ok(
                Map.of("downloadUrl", downloadUrl.toString())));
    }

    @GetMapping
    @Operation(summary = "List uploads", description = "List uploaded files for an entity")
    @ApiResponse(responseCode = "200", description = "Uploads retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<?>>> listUploads(
            @RequestParam(name = "entity_type") String entityType,
            @RequestParam(name = "entity_id") String entityId) {

        List<?> uploads = uploadService.listUploads(entityType, entityId);
        return ResponseEntity.ok(responseBuilder.ok(uploads));
    }

    @DeleteMapping("/{uploadId}")
    @Operation(summary = "Delete upload", description = "Delete an uploaded file and its metadata")
    @ApiResponse(responseCode = "204", description = "Upload deleted")
    public ResponseEntity<Void> deleteUpload(@PathVariable("uploadId") UUID uploadId) {
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        uploadService.deleteUpload(uploadId, actorId);
        return ResponseEntity.noContent().build();
    }
}
