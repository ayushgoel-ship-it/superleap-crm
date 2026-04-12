package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.UploadMetadataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UploadMetadataRepository extends JpaRepository<UploadMetadataEntity, UUID> {

    List<UploadMetadataEntity> findByEntityTypeAndEntityIdAndDeletedAtIsNull(String entityType, String entityId);

    List<UploadMetadataEntity> findByUploadedBy(UUID uploadedBy);
}
