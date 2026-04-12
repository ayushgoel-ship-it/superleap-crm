package com.cars24.crmapi.dto.common;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiMeta {

    String timestamp;
    @JsonProperty("request_id")
    String requestId;
}
