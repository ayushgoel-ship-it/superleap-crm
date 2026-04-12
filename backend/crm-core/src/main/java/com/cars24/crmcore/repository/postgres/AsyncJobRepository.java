package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.AsyncJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AsyncJobRepository extends JpaRepository<AsyncJobEntity, UUID> {

    List<AsyncJobEntity> findByCreatedByOrderByCreatedAtDesc(UUID createdBy);

    List<AsyncJobEntity> findByJobTypeAndStatus(String jobType, String status);
}
