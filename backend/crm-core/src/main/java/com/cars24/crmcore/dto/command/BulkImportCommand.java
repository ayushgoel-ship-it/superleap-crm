package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class BulkImportCommand {
    String csvContent;
    String importType;
    UUID actorId;
}
