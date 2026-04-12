package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

    List<TaskEntity> findByOwnerUserId(UUID ownerUserId);

    List<TaskEntity> findByEntityTypeAndEntityId(String entityType, String entityId);

    List<TaskEntity> findByOwnerUserIdAndStatus(UUID ownerUserId, String status);
}
