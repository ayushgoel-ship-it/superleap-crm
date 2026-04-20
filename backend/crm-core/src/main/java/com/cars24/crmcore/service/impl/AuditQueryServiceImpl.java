package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.AuditLogEntity;
import com.cars24.crmcore.repository.postgres.AuditLogRepository;
import com.cars24.crmcore.service.internal.AuditQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AuditQueryServiceImpl implements AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    public AuditQueryServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public PaginatedResponse<AuditLogEntity> listAuditLogs(String entityType, String entityId, Pageable pageable) {
        Page<AuditLogEntity> page;

        if (entityType != null && entityId != null) {
            page = auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        } else {
            page = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return PaginatedResponse.<AuditLogEntity>builder()
                .items(page.getContent())
                .page(page.getNumber())
                .pageSize(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
