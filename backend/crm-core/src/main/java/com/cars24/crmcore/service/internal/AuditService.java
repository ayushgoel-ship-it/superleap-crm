package com.cars24.crmcore.service.internal;

import java.util.UUID;

/**
 * Shared audit logging service. Every write operation should call this to produce an audit trail.
 * The requestId parameter should be extracted from the request context by the caller (controller or command service).
 */
public interface AuditService {

    void log(UUID actorId, String actorRole, String action,
             String entityType, String entityId,
             String oldValues, String newValues, String changeSummary,
             String requestId);
}
