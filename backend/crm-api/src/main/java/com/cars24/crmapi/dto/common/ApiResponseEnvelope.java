package com.cars24.crmapi.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiResponseEnvelope<T> {

    boolean success;
    T data;
    ApiResponseMeta meta;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    ApiErrorBody error;

    @JsonProperty("success")
    public boolean isSuccess() {
        return success;
    }
}
