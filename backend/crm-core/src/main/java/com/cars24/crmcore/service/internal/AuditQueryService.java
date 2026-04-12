package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.AuditLogEntity;
import org.springframework.data.domain.Pageable;

public interface AuditQueryService {

    PaginatedResponse<AuditLogEntity> listAuditLogs(String entityType, String entityId, Pageable pageable);
}
