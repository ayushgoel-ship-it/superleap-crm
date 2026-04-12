package com.cars24.crmcore.external;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.time.Duration;

/**
 * No-op storage client used when storage is disabled.
 * Returns placeholder URLs and logs operations.
 */
public class NoOpStorageClient implements StorageClient {

    private static final Logger log = LoggerFactory.getLogger(NoOpStorageClient.class);

    @Override
    public URL generateUploadUrl(String key, String contentType, Duration expiration) {
        log.warn("Storage disabled — generateUploadUrl called for key={}", key);
        return placeholderUrl(key);
    }

    @Override
    public URL generateDownloadUrl(String key, Duration expiration) {
        log.warn("Storage disabled — generateDownloadUrl called for key={}", key);
        return placeholderUrl(key);
    }

    @Override
    public void deleteObject(String key) {
        log.warn("Storage disabled — deleteObject called for key={}", key);
    }

    private URL placeholderUrl(String key) {
        try {
            return URI.create("https://storage.disabled.local/" + key).toURL();
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Failed to create placeholder URL", e);
        }
    }
}
