package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class UpdateIncentiveRuleCommand {
    String scope;
    BigDecimal threshold;
    BigDecimal payout;
    String description;
    Instant effectiveFrom;
    Instant effectiveTo;
}
