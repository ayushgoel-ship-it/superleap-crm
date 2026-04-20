package com.cars24.crmapi.auth;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RequestContext {

    boolean authenticated;
    ActorContext authenticatedActor;
    ActorContext effectiveActor;
    ActorScope actorScope;
    AuthMetadata metadata;
}
