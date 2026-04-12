package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.BulkImportCommand;

import java.util.UUID;

public interface BulkImportService {

    UUID submitBulkImport(BulkImportCommand command, String requestId);
}
