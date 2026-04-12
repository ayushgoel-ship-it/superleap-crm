package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.controller.support.PaginationHelper;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.AuditLogEntity;
import com.cars24.crmcore.service.internal.AuditQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/web/v1/admin/audit")
@Tag(name = "Admin — Audit", description = "Audit trail — view change history (ADMIN only)")
public class AdminAuditController extends BaseController {

    private final AuditQueryService auditQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AdminAuditController(AuditQueryService auditQueryService,
                                ActorScopeResolver actorScopeResolver,
                                ApiResponseBuilder responseBuilder) {
        this.auditQueryService = auditQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List audit logs", description = "Paginated audit trail filtered by entity type and ID")
    @ApiResponse(responseCode = "200", description = "Audit logs retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<AuditLogEntity>>> listAuditLogs(
            @RequestParam(name = "entity_type", required = false) String entityType,
            @RequestParam(name = "entity_id", required = false) String entityId,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "page_size", required = false) Integer pageSize) {

        actorScopeResolver.requireRole("ADMIN");
        Pageable pageable = PaginationHelper.toPageable(page, pageSize);
        PaginatedResponse<AuditLogEntity> result = auditQueryService.listAuditLogs(entityType, entityId, pageable);
        return ResponseEntity.ok(responseBuilder.okPaginated(result));
    }
}
