package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class CreateIncentiveSlabCommand {
    String slabName;
    String metricKey;
    BigDecimal minValue;
    BigDecimal maxValue;
    BigDecimal payoutAmount;
    String payoutType;
    String roleScope;
    Instant effectiveFrom;
    Instant effectiveTo;
}
