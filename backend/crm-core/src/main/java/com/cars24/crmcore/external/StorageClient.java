package com.cars24.crmcore.external;

import java.net.URL;
import java.time.Duration;

/**
 * Abstraction over object storage (S3-compatible).
 * Allows generating pre-signed URLs for upload and download
 * without exposing storage credentials to clients.
 */
public interface StorageClient {

    /**
     * Generate a pre-signed URL for uploading a file.
     *
     * @param key         the storage object key (e.g. "visit/123/photo.jpg")
     * @param contentType the expected content type of the upload
     * @param expiration  how long the URL remains valid
     * @return a pre-signed PUT URL
     */
    URL generateUploadUrl(String key, String contentType, Duration expiration);

    /**
     * Generate a pre-signed URL for downloading/reading a file.
     *
     * @param key        the storage object key
     * @param expiration how long the URL remains valid
     * @return a pre-signed GET URL
     */
    URL generateDownloadUrl(String key, Duration expiration);

    /**
     * Delete an object from storage.
     *
     * @param key the storage object key
     */
    void deleteObject(String key);
}
