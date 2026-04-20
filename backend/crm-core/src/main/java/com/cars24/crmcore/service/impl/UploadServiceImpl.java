package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.entity.UploadMetadataEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.external.StorageClient;
import com.cars24.crmcore.repository.postgres.UploadMetadataRepository;
import com.cars24.crmcore.service.internal.UploadService;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class UploadServiceImpl implements UploadService {

    private final UploadMetadataRepository uploadMetadataRepository;
    private final StorageClient storageClient;

    public UploadServiceImpl(UploadMetadataRepository uploadMetadataRepository,
                             StorageClient storageClient) {
        this.uploadMetadataRepository = uploadMetadataRepository;
        this.storageClient = storageClient;
    }

    @Override
    public UploadInitiation initiateUpload(String entityType, String entityId, String fileName,
                                            String contentType, long sizeBytes, UUID uploadedBy) {
        UUID uploadId = UUID.randomUUID();
        String storageKey = entityType + "/" + entityId + "/" + uploadId + "/" + fileName;

        UploadMetadataEntity metadata = new UploadMetadataEntity();
        metadata.setUploadId(uploadId);
        metadata.setEntityType(entityType);
        metadata.setEntityId(entityId);
        metadata.setFileName(fileName);
        metadata.setContentType(contentType);
        metadata.setSizeBytes(sizeBytes);
        metadata.setStorageKey(storageKey);
        metadata.setUploadedBy(uploadedBy);
        metadata.setCreatedAt(Instant.now());

        uploadMetadataRepository.save(metadata);

        URL uploadUrl = storageClient.generateUploadUrl(storageKey, contentType, Duration.ofMinutes(15));

        return new UploadInitiation(uploadId, uploadUrl, storageKey);
    }

    @Override
    public URL getDownloadUrl(UUID uploadId) {
        UploadMetadataEntity metadata = uploadMetadataRepository.findById(uploadId)
                .orElseThrow(() -> new ResourceNotFoundException("Upload not found: " + uploadId));

        if (metadata.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Upload has been deleted: " + uploadId);
        }

        return storageClient.generateDownloadUrl(metadata.getStorageKey(), Duration.ofMinutes(15));
    }

    @Override
    public List<UploadMetadataEntity> listUploads(String entityType, String entityId) {
        return uploadMetadataRepository.findByEntityTypeAndEntityIdAndDeletedAtIsNull(entityType, entityId);
    }

    @Override
    public void deleteUpload(UUID uploadId, UUID actorId) {
        UploadMetadataEntity metadata = uploadMetadataRepository.findById(uploadId)
                .orElseThrow(() -> new ResourceNotFoundException("Upload not found: " + uploadId));

        metadata.setDeletedAt(Instant.now());
        uploadMetadataRepository.save(metadata);
    }
}
