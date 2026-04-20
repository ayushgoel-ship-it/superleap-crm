package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class InitiateUploadRequest {

    @NotBlank
    @JsonProperty("entity_type")
    private String entityType;

    @NotBlank
    @JsonProperty("entity_id")
    private String entityId;

    @NotBlank
    @JsonProperty("file_name")
    private String fileName;

    @NotBlank
    @JsonProperty("content_type")
    private String contentType;

    @Positive
    @JsonProperty("size_bytes")
    private long sizeBytes;
}
