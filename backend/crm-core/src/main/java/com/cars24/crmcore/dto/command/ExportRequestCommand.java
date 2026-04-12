package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.util.Map;
import java.util.UUID;

@Value
@Builder
public class ExportRequestCommand {
    String exportType;
    Map<String, String> filters;
    UUID actorId;
}
