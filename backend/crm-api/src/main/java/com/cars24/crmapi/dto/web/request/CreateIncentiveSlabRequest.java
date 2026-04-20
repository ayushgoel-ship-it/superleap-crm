package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateIncentiveSlabRequest {

    @NotBlank
    @JsonProperty("slab_name")
    private String slabName;

    @NotBlank
    @JsonProperty("metric_key")
    private String metricKey;

    @NotNull
    @JsonProperty("min_value")
    private BigDecimal minValue;

    @NotNull
    @JsonProperty("max_value")
    private BigDecimal maxValue;

    @NotNull
    @JsonProperty("payout_amount")
    private BigDecimal payoutAmount;

    @JsonProperty("payout_type")
    private String payoutType;

    @JsonProperty("role_scope")
    private String roleScope;

    @JsonProperty("effective_from")
    private Instant effectiveFrom;

    @JsonProperty("effective_to")
    private Instant effectiveTo;
}
