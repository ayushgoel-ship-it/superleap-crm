package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.entity.AsyncJobEntity;

import java.util.List;
import java.util.UUID;

public interface AsyncJobService {

    AsyncJobEntity createJob(String jobType, String inputPayload, UUID createdBy);

    AsyncJobEntity markRunning(UUID jobId);

    AsyncJobEntity markCompleted(UUID jobId, String resultSummary);

    AsyncJobEntity markFailed(UUID jobId, String errorMessage);

    AsyncJobEntity getJob(UUID jobId);

    List<AsyncJobEntity> getJobsByUser(UUID userId);
}
