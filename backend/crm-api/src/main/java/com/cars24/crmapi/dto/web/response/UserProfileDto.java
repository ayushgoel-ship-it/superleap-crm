package com.cars24.crmapi.dto.web.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class UserProfileDto {

    @JsonProperty("user_id")
    String userId;
    String role;
    List<String> roles;
    List<String> permissions;
    @JsonProperty("tenant_group")
    String tenantGroup;
}
