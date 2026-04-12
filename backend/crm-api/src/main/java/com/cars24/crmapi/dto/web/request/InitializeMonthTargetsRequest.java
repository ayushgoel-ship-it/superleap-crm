package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitializeMonthTargetsRequest {

    @NotBlank
    private String period;

    @JsonProperty("source_period")
    private String sourcePeriod;
}
