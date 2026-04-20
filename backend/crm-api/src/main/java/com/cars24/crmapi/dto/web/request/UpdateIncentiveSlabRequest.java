package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class UpdateIncentiveSlabRequest {

    @JsonProperty("slab_name")
    private String slabName;

    @JsonProperty("min_value")
    private BigDecimal minValue;

    @JsonProperty("max_value")
    private BigDecimal maxValue;

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
