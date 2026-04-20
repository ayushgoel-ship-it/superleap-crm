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
public class UpdateIncentiveRuleRequest {

    private String scope;
    private BigDecimal threshold;
    private BigDecimal payout;
    private String description;

    @JsonProperty("effective_from")
    private Instant effectiveFrom;

    @JsonProperty("effective_to")
    private Instant effectiveTo;
}
