package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class CreateUserCommand {
    String name;
    String email;
    String phone;
    String role;
    UUID teamId;
    String region;
    String city;
}
