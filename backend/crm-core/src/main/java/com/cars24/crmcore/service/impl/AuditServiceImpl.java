package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.entity.AuditLogEntity;
import com.cars24.crmcore.repository.postgres.AuditLogRepository;
import com.cars24.crmcore.service.internal.AuditService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void log(UUID actorId, String actorRole, String action,
                    String entityType, String entityId,
                    String oldValues, String newValues, String changeSummary,
                    String requestId) {

        AuditLogEntity entry = new AuditLogEntity();
        entry.setActorId(actorId);
        entry.setActorRole(actorRole);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setOldValues(oldValues);
        entry.setNewValues(newValues);
        entry.setChangeSummary(changeSummary);
        entry.setRequestId(requestId);
        entry.setCreatedAt(Instant.now());

        auditLogRepository.save(entry);
    }
}
