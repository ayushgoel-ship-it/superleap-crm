package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.ExportRequestCommand;

import java.util.UUID;

public interface ExportService {

    UUID submitExport(ExportRequestCommand command, String requestId);
}
