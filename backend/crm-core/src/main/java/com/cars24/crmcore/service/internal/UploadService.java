package com.cars24.crmcore.service.internal;

import java.net.URL;
import java.util.List;
import java.util.UUID;

public interface UploadService {

    /**
     * Create upload metadata and return a pre-signed upload URL.
     */
    UploadInitiation initiateUpload(String entityType, String entityId, String fileName,
                                     String contentType, long sizeBytes, UUID uploadedBy);

    /**
     * Get a download URL for an existing upload.
     */
    URL getDownloadUrl(UUID uploadId);

    /**
     * List uploads for an entity.
     */
    List<?> listUploads(String entityType, String entityId);

    /**
     * Soft-delete an upload.
     */
    void deleteUpload(UUID uploadId, UUID actorId);

    record UploadInitiation(UUID uploadId, URL uploadUrl, String storageKey) {}
}
