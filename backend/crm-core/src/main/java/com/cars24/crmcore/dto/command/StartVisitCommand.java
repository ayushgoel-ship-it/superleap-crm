package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Value
@Builder
public class StartVisitCommand {
    String dealerId;
    String dealerCode;
    String dealerName;
    String untaggedDealerId;
    UUID kamId;
    String tlId;
    String visitType;
    BigDecimal geoLat;
    BigDecimal geoLng;
    String notes;
}
