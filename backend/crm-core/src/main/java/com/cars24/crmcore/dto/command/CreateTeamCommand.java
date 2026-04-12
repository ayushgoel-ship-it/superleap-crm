package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class CreateTeamCommand {
    String teamName;
    String region;
    String city;
    UUID tlUserId;
}
