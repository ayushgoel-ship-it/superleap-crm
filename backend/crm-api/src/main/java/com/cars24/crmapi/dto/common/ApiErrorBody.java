package com.cars24.crmapi.dto.common;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiErrorBody {

    String code;
    String message;
}
