package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class UpdateLeadPricingCommand {
    BigDecimal cep;
    String cepConfidence;
}
