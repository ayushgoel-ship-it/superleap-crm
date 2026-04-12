package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {

    List<AuditLogEntity> findByEntityTypeAndEntityId(String entityType, String entityId);

    Page<AuditLogEntity> findByEntityTypeAndEntityId(String entityType, String entityId, Pageable pageable);

    Page<AuditLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
