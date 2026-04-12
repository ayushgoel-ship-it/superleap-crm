package com.cars24.crmapi.controller.app;

import com.cars24.crmapi.auth.ActorScope;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmcore.dto.DashboardSummary;
import com.cars24.crmcore.service.internal.DashboardQueryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/app/v1/dashboard")
@Tag(name = "App — Dashboard", description = "Mobile app home dashboard aggregates")
public class AppDashboardController {

    private final DashboardQueryService dashboardQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AppDashboardController(DashboardQueryService dashboardQueryService,
                                  ActorScopeResolver actorScopeResolver,
                                  ApiResponseBuilder responseBuilder) {
        this.dashboardQueryService = dashboardQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping("/home")
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
