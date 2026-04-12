package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.InitializeMonthTargetsRequest;
import com.cars24.crmapi.dto.web.request.UpdateTargetRequest;
import com.cars24.crmcore.dto.command.InitializeMonthTargetsCommand;
import com.cars24.crmcore.dto.command.UpdateTargetCommand;
import com.cars24.crmcore.entity.TargetEntity;
import com.cars24.crmcore.service.internal.TargetCommandService;
import com.cars24.crmcore.service.internal.TargetQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/web/v1/admin/targets")
@Tag(name = "Admin — Targets", description = "KAM/TL target management (ADMIN only)")
public class AdminTargetController extends BaseController {

    private final TargetCommandService targetCommandService;
    private final TargetQueryService targetQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AdminTargetController(TargetCommandService targetCommandService,
                                 TargetQueryService targetQueryService,
                                 ActorScopeResolver actorScopeResolver,
                                 ApiResponseBuilder responseBuilder) {
        this.targetCommandService = targetCommandService;
        this.targetQueryService = targetQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List targets", description = "List KAM targets by period and optionally by team")
    @ApiResponse(responseCode = "200", description = "Targets retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<TargetEntity>>> listTargets(
            @RequestParam(name = "period") String period,
            @RequestParam(name = "team_id", required = false) String teamId) {

        actorScopeResolver.requireRole("ADMIN");
        List<TargetEntity> targets = (teamId != null)
                ? targetQueryService.listByTeamAndPeriod(teamId, period)
                : targetQueryService.listByPeriod(period);
        return ResponseEntity.ok(responseBuilder.ok(targets));
    }

    @PutMapping("/{targetId}")
    @Operation(summary = "Update target", description = "Set SI, call, visit, DCF, and revenue targets")
    @ApiResponse(responseCode = "200", description = "Target updated")
    public ResponseEntity<ApiResponseEnvelope<TargetEntity>> updateTarget(
            @PathVariable("targetId") UUID targetId,
            @Valid @RequestBody UpdateTargetRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        UpdateTargetCommand command = UpdateTargetCommand.builder()
                .siTarget(request.getSiTarget())
                .callTarget(request.getCallTarget())
                .visitTarget(request.getVisitTarget())
                .dcfLeadsTarget(request.getDcfLeadsTarget())
                .dcfDisbursalTarget(request.getDcfDisbursalTarget())
                .revenueTarget(request.getRevenueTarget())
                .build();

        TargetEntity updated = targetCommandService.updateTarget(targetId, command, actorId, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }

    @PostMapping("/initialize")
    @Operation(summary = "Initialize month targets", description = "Create target records for a new period, optionally copying from a source period")
    @ApiResponse(responseCode = "201", description = "Targets initialized")
    public ResponseEntity<ApiResponseEnvelope<List<TargetEntity>>> initializeMonthTargets(
            @Valid @RequestBody InitializeMonthTargetsRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        InitializeMonthTargetsCommand command = InitializeMonthTargetsCommand.builder()
                .period(request.getPeriod())
                .sourcePeriod(request.getSourcePeriod())
                .build();

        List<TargetEntity> created = targetCommandService.initializeMonth(command, actorId, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }
}
