package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class LogUntaggedDealerCommand {
    String phone;
    String name;
    String city;
    String region;
    String address;
    String notes;
    UUID createdBy;
}
