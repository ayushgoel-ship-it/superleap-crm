package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class LocationUpdateCommand {
    String dealerCode;
    String newAddress;
    String newCity;
    String newRegion;
    String reason;
}
