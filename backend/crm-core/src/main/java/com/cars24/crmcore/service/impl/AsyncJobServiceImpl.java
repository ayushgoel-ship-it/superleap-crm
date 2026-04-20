package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.AsyncJobRepository;
import com.cars24.crmcore.service.internal.AsyncJobService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AsyncJobServiceImpl implements AsyncJobService {

    private final AsyncJobRepository asyncJobRepository;

    public AsyncJobServiceImpl(AsyncJobRepository asyncJobRepository) {
        this.asyncJobRepository = asyncJobRepository;
    }

    @Override
    @Transactional
    public AsyncJobEntity createJob(String jobType, String inputPayload, UUID createdBy) {
        AsyncJobEntity entity = new AsyncJobEntity();
        entity.setJobType(jobType);
        entity.setStatus("PENDING");
        entity.setInputPayload(inputPayload);
        entity.setCreatedBy(createdBy);
        entity.setCreatedAt(Instant.now());
        return asyncJobRepository.save(entity);
    }

    @Override
    @Transactional
    public AsyncJobEntity markRunning(UUID jobId) {
        AsyncJobEntity entity = findOrThrow(jobId);
        entity.setStatus("RUNNING");
        entity.setStartedAt(Instant.now());
        return asyncJobRepository.save(entity);
    }

    @Override
    @Transactional
    public AsyncJobEntity markCompleted(UUID jobId, String resultSummary) {
        AsyncJobEntity entity = findOrThrow(jobId);
        entity.setStatus("COMPLETED");
        entity.setResultSummary(resultSummary);
        entity.setCompletedAt(Instant.now());
        return asyncJobRepository.save(entity);
    }

    @Override
    @Transactional
    public AsyncJobEntity markFailed(UUID jobId, String errorMessage) {
        AsyncJobEntity entity = findOrThrow(jobId);
        entity.setStatus("FAILED");
        entity.setErrorMessage(errorMessage);
        entity.setCompletedAt(Instant.now());
        return asyncJobRepository.save(entity);
    }

    @Override
    public AsyncJobEntity getJob(UUID jobId) {
        return findOrThrow(jobId);
    }

    @Override
    public List<AsyncJobEntity> getJobsByUser(UUID userId) {
        return asyncJobRepository.findByCreatedByOrderByCreatedAtDesc(userId);
    }

    private AsyncJobEntity findOrThrow(UUID jobId) {
        return asyncJobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Async job not found: " + jobId));
    }
}
