package com.cars24.crmapi.controller.support;

import com.cars24.crmapi.auth.ActorContext;
import com.cars24.crmapi.auth.ActorScope;
import com.cars24.crmapi.auth.RequestContext;
import com.cars24.crmapi.auth.RequestContextAccessor;
import com.cars24.crmcore.exception.ForbiddenException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Convenience wrapper around RequestContextAccessor that provides role-scoped
 * data filtering parameters for controllers. Keeps scoping logic out of individual controllers.
 */
@Component
public class ActorScopeResolver {

    private final RequestContextAccessor requestContextAccessor;

    public ActorScopeResolver(RequestContextAccessor requestContextAccessor) {
        this.requestContextAccessor = requestContextAccessor;
    }

    public RequestContext getRequiredContext() {
        return requestContextAccessor.getRequiredContext();
    }

    public ActorContext getEffectiveActor() {
        return getRequiredContext().getEffectiveActor();
    }

    public String getEffectiveUserId() {
        return getEffectiveActor().getUserId();
    }

    public UUID getEffectiveUserIdAsUuid() {
        return UUID.fromString(getEffectiveUserId());
    }

    public String getEffectiveRole() {
        List<String> roles = getEffectiveActor().getRoles();
        return (roles != null && !roles.isEmpty()) ? roles.get(0) : "UNKNOWN";
    }

    public ActorScope getActorScope() {
        return getRequiredContext().getActorScope();
    }

    /**
     * Returns the KAM user ID for data filtering.
     * SELF scope: returns the effective user's UUID (KAM sees own data).
     * TEAM/GLOBAL/IMPERSONATED: returns null (no KAM filter).
     */
    public UUID getKamIdForScope() {
        ActorScope scope = getActorScope();
        if (scope == ActorScope.SELF) {
            return getEffectiveUserIdAsUuid();
        }
        return null;
    }

    /**
     * Returns the TL user ID for data filtering.
     * TEAM scope: returns the effective user's UUID (TL sees team data).
     * SELF/GLOBAL/IMPERSONATED: returns null (no TL filter).
     */
    public UUID getTlIdForScope() {
        ActorScope scope = getActorScope();
        if (scope == ActorScope.TEAM) {
            return getEffectiveUserIdAsUuid();
        }
        return null;
    }

    /**
     * Returns the KAM ID as String for services that use String-typed parameters.
     */
    public String getKamIdStringForScope() {
        UUID kamId = getKamIdForScope();
        return kamId != null ? kamId.toString() : null;
    }

    public void requirePermission(String permission) {
        List<String> permissions = getEffectiveActor().getPermissions();
        if (permissions == null || !permissions.contains(permission)) {
            throw new ForbiddenException("Missing required permission: " + permission);
        }
    }

    public void requireRole(String role) {
        List<String> roles = getEffectiveActor().getRoles();
        if (roles == null || !roles.contains(role)) {
            throw new ForbiddenException("Insufficient role for this operation");
        }
    }
}
