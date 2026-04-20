package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.*;
import com.cars24.crmcore.dto.command.*;
import com.cars24.crmcore.entity.IncentiveRuleEntity;
import com.cars24.crmcore.entity.IncentiveSlabEntity;
import com.cars24.crmcore.service.internal.ConfigCommandService;
import com.cars24.crmcore.service.internal.ConfigQueryService;
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
@RequestMapping("/web/v1/admin/config")
@Tag(name = "Admin — Config", description = "Incentive slabs and rules (ADMIN only)")
public class AdminConfigController extends BaseController {

    private final ConfigCommandService configCommandService;
    private final ConfigQueryService configQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AdminConfigController(ConfigCommandService configCommandService,
                                 ConfigQueryService configQueryService,
                                 ActorScopeResolver actorScopeResolver,
                                 ApiResponseBuilder responseBuilder) {
        this.configCommandService = configCommandService;
        this.configQueryService = configQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping("/slabs")
    @Operation(summary = "List incentive slabs", description = "Filter slabs by metric key and role scope")
    @ApiResponse(responseCode = "200", description = "Slabs retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<IncentiveSlabEntity>>> listSlabs(
            @RequestParam(name = "metric_key", required = false) String metricKey,
            @RequestParam(name = "role_scope", required = false) String roleScope) {

        actorScopeResolver.requireRole("ADMIN");
        List<IncentiveSlabEntity> slabs = configQueryService.listSlabs(metricKey, roleScope);
        return ResponseEntity.ok(responseBuilder.ok(slabs));
    }

    @GetMapping("/rules")
    @Operation(summary = "List incentive rules", description = "Filter rules by metric key and scope")
    @ApiResponse(responseCode = "200", description = "Rules retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<IncentiveRuleEntity>>> listRules(
            @RequestParam(name = "metric_key", required = false) String metricKey,
            @RequestParam(name = "scope", required = false) String scope) {

        actorScopeResolver.requireRole("ADMIN");
        List<IncentiveRuleEntity> rules = configQueryService.listRules(metricKey, scope);
        return ResponseEntity.ok(responseBuilder.ok(rules));
    }

    @PostMapping("/slabs")
    @Operation(summary = "Create incentive slab", description = "Create a new incentive slab with payout tiers")
    @ApiResponse(responseCode = "201", description = "Slab created")
    public ResponseEntity<ApiResponseEnvelope<IncentiveSlabEntity>> createSlab(
            @Valid @RequestBody CreateIncentiveSlabRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        CreateIncentiveSlabCommand command = CreateIncentiveSlabCommand.builder()
                .slabName(request.getSlabName())
                .metricKey(request.getMetricKey())
                .minValue(request.getMinValue())
                .maxValue(request.getMaxValue())
                .payoutAmount(request.getPayoutAmount())
                .payoutType(request.getPayoutType())
                .roleScope(request.getRoleScope())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .build();

        IncentiveSlabEntity created = configCommandService.createSlab(command, actorId, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

    @PutMapping("/slabs/{slabId}")
    @Operation(summary = "Update incentive slab", description = "Modify an existing incentive slab")
    @ApiResponse(responseCode = "200", description = "Slab updated")
    public ResponseEntity<ApiResponseEnvelope<IncentiveSlabEntity>> updateSlab(
            @PathVariable("slabId") UUID slabId,
            @Valid @RequestBody UpdateIncentiveSlabRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        UpdateIncentiveSlabCommand command = UpdateIncentiveSlabCommand.builder()
                .slabName(request.getSlabName())
                .minValue(request.getMinValue())
                .maxValue(request.getMaxValue())
                .payoutAmount(request.getPayoutAmount())
                .payoutType(request.getPayoutType())
                .roleScope(request.getRoleScope())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .build();

        IncentiveSlabEntity updated = configCommandService.updateSlab(slabId, command, actorId, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }

    @PostMapping("/rules")
    @Operation(summary = "Create incentive rule", description = "Create a new incentive rule with threshold and payout")
    @ApiResponse(responseCode = "201", description = "Rule created")
    public ResponseEntity<ApiResponseEnvelope<IncentiveRuleEntity>> createRule(
            @Valid @RequestBody CreateIncentiveRuleRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        CreateIncentiveRuleCommand command = CreateIncentiveRuleCommand.builder()
                .scope(request.getScope())
                .metricKey(request.getMetricKey())
                .threshold(request.getThreshold())
                .payout(request.getPayout())
                .description(request.getDescription())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .build();

        IncentiveRuleEntity created = configCommandService.createRule(command, actorId, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

    @PutMapping("/rules/{ruleId}")
    @Operation(summary = "Update incentive rule", description = "Modify an existing incentive rule")
    @ApiResponse(responseCode = "200", description = "Rule updated")
    public ResponseEntity<ApiResponseEnvelope<IncentiveRuleEntity>> updateRule(
            @PathVariable("ruleId") UUID ruleId,
            @Valid @RequestBody UpdateIncentiveRuleRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        UpdateIncentiveRuleCommand command = UpdateIncentiveRuleCommand.builder()
                .scope(request.getScope())
                .threshold(request.getThreshold())
                .payout(request.getPayout())
                .description(request.getDescription())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .build();

        IncentiveRuleEntity updated = configCommandService.updateRule(ruleId, command, actorId, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }
}
