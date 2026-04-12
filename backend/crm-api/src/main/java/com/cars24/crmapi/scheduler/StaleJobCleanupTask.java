package com.cars24.crmapi.scheduler;

import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.repository.postgres.AsyncJobRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class StaleJobCleanupTask {

    private static final Logger log = LoggerFactory.getLogger(StaleJobCleanupTask.class);

    private final AsyncJobRepository asyncJobRepository;
    private final Counter staleJobsFailedCounter;

    public StaleJobCleanupTask(AsyncJobRepository asyncJobRepository, MeterRegistry meterRegistry) {
        this.asyncJobRepository = asyncJobRepository;
        this.staleJobsFailedCounter = Counter.builder("crm.scheduler.stale_jobs_failed")
                .description("Number of stuck async jobs marked as FAILED by cleanup task")
                .register(meterRegistry);
    }

    @Scheduled(cron = "${crm.scheduler.stale-job-cleanup-cron:0 30 2 * * ?}")
    public void failStaleJobs() {
        log.info("Starting stale job cleanup task");
        Instant cutoff = Instant.now().minus(2, ChronoUnit.HOURS);
        int count = 0;

        for (String status : List.of("PENDING", "RUNNING")) {
            List<AsyncJobEntity> staleJobs = asyncJobRepository.findByJobTypeAndStatus(null, status);
            for (AsyncJobEntity job : staleJobs) {
                Instant ref = job.getStartedAt() != null ? job.getStartedAt() : job.getCreatedAt();
                if (ref != null && ref.isBefore(cutoff)) {
                    job.setStatus("FAILED");
                    job.setErrorMessage("Timed out — marked as failed by cleanup task");
                    job.setCompletedAt(Instant.now());
                    asyncJobRepository.save(job);
                    count++;
                }
            }
        }

        staleJobsFailedCounter.increment(count);
        log.info("Stale job cleanup complete: {} jobs marked as FAILED", count);
    }
}
