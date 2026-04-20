package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class CreateLeadCommand {
    String dealerCode;
    String dealerName;
    String customerName;
    String customerPhone;
    String channel;
    String leadType;
    String make;
    String model;
    String year;
    String city;
    String region;
    UUID kamId;
    String tlId;
}
