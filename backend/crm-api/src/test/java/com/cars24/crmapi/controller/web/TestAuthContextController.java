package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.RequestContext;
import com.cars24.crmapi.auth.RequestContextAccessor;
import lombok.Builder;
import lombok.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
class TestAuthContextController {

    private final RequestContextAccessor requestContextAccessor;

    TestAuthContextController(RequestContextAccessor requestContextAccessor) {
        this.requestContextAccessor = requestContextAccessor;
    }

    @GetMapping("/web/v1/test/auth-context")
    AuthContextResponse authContext() {
        RequestContext requestContext = requestContextAccessor.getRequiredContext();
        return AuthContextResponse.builder()
                .authenticatedUserId(requestContext.getAuthenticatedActor().getUserId())
                .effectiveUserId(requestContext.getEffectiveActor().getUserId())
                .roles(requestContext.getEffectiveActor().getRoles())
                .permissions(requestContext.getEffectiveActor().getPermissions())
                .scope(requestContext.getActorScope().name())
                .tenantGroup(requestContext.getEffectiveActor().getTenantGroup())
                .authSource(requestContext.getMetadata().getAuthSource())
                .requestId(requestContext.getMetadata().getRequestId())
                .build();
    }

    @Value
    @Builder
    private static class AuthContextResponse {
        String authenticatedUserId;
        String effectiveUserId;
        List<String> roles;
        List<String> permissions;
        String scope;
        String tenantGroup;
        String authSource;
        String requestId;
    }
}
