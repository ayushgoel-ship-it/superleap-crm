package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class UpdateTargetCommand {
    Integer siTarget;
    Integer callTarget;
    Integer visitTarget;
    Integer dcfLeadsTarget;
    Integer dcfDisbursalTarget;
    BigDecimal revenueTarget;
}
