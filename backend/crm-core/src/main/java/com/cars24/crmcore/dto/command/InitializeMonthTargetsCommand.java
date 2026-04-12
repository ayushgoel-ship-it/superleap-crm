package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class InitializeMonthTargetsCommand {
    String period;
    String sourcePeriod;
}
