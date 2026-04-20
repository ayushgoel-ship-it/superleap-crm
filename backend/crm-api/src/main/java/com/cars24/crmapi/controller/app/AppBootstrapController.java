package com.cars24.crmapi.controller.app;

import com.cars24.crmapi.auth.ActorContext;
import com.cars24.crmapi.auth.ActorScope;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.response.BootstrapResponse;
import com.cars24.crmapi.dto.web.response.UserProfileDto;
import com.cars24.crmcore.dto.OrgHierarchyDto;
import com.cars24.crmcore.service.internal.OrgQueryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/app/v1/bootstrap")
@Tag(name = "App — Bootstrap", description = "Mobile app session initialization — user profile and org hierarchy")
public class AppBootstrapController {

    private final OrgQueryService orgQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AppBootstrapController(OrgQueryService orgQueryService,
                                  ActorScopeResolver actorScopeResolver,
                                  ApiResponseBuilder responseBuilder) {
        this.orgQueryService = orgQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    public ResponseEntity<ApiResponseEnvelope<BootstrapResponse>> bootstrap() {
        ActorContext actor = actorScopeResolver.getEffectiveActor();
        ActorScope scope = actorScopeResolver.getActorScope();

        UserProfileDto profile = UserProfileDto.builder()
                .userId(actor.getUserId())
                .role(actorScopeResolver.getEffectiveRole())
                .roles(actor.getRoles())
                .permissions(actor.getPermissions())
                .tenantGroup(actor.getTenantGroup())
                .build();

        OrgHierarchyDto orgHierarchy = null;
        if (scope == ActorScope.TEAM || scope == ActorScope.GLOBAL || scope == ActorScope.IMPERSONATED) {
            orgHierarchy = orgQueryService.getOrgHierarchy();
        }

        BootstrapResponse data = BootstrapResponse.builder()
                .profile(profile)
                .orgHierarchy(orgHierarchy)
                .build();

        return ResponseEntity.ok(responseBuilder.ok(data));
    }
}
