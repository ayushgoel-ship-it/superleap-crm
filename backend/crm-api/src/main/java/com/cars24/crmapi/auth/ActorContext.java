package com.cars24.crmapi.auth;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ActorContext {

    String userId;
    List<String> roles;
    List<String> permissions;
    String tenantGroup;
}
