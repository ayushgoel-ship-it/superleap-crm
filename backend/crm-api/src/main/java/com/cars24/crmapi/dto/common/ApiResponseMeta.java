package com.cars24.crmapi.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponseMeta {

    String timestamp;
    @JsonProperty("request_id")
    String requestId;
    @JsonProperty("time_scope")
    String timeScope;
    String role;
    PaginationMeta pagination;
}
