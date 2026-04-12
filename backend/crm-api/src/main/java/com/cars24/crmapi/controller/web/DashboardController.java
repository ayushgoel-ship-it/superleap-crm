package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.auth.ActorScope;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmcore.dto.DashboardSummary;
import com.cars24.crmcore.service.internal.DashboardQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/web/v1/dashboard")
@Tag(name = "Dashboard", description = "Home dashboard aggregates")
public class DashboardController {

    private final DashboardQueryService dashboardQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public DashboardController(DashboardQueryService dashboardQueryService,
                               ActorScopeResolver actorScopeResolver,
                               ApiResponseBuilder responseBuilder) {
        this.dashboardQueryService = dashboardQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping("/home")
    @Operation(summary = "Home dashboard", description = "Aggregated dashboard metrics scoped by role and time period")
    @ApiResponse(responseCode = "200", description = "Dashboard data retrieved")
    public ResponseEntity<ApiResponseEnvelope<DashboardSummary>> home(
            @RequestParam(name = "time_scope", defaultValue = "mtd") String timeScope) {

        UUID userId = null;
        ActorScope scope = actorScopeResolver.getActorScope();
        if (scope == ActorScope.SELF || scope == ActorScope.TEAM) {
            userId = actorScopeResolver.getEffectiveUserIdAsUuid();
        }

        String role = actorScopeResolver.getEffectiveRole();
        DashboardSummary summary = dashboardQueryService.getDashboardSummary(userId, role);

        return ResponseEntity.ok(responseBuilder.ok(summary, timeScope));
    }
}
