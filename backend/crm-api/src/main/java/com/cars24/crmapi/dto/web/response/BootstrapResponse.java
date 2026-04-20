package com.cars24.crmapi.dto.web.response;

import com.cars24.crmcore.dto.OrgHierarchyDto;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BootstrapResponse {

    UserProfileDto profile;
    @JsonProperty("org_hierarchy")
    OrgHierarchyDto orgHierarchy;
}
