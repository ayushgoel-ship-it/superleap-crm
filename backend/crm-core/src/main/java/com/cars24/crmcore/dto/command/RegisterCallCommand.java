package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Value
@Builder
public class RegisterCallCommand {
    String dealerId;
    String dealerCode;
    String dealerName;
    String leadId;
    UUID kamId;
    String tlId;
    String phone;
    String direction;
    LocalDate callDate;
    Instant callStartTime;
    String notes;
}
