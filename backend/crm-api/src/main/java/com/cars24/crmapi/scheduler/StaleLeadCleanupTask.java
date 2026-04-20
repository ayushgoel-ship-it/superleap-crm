package com.cars24.crmapi.scheduler;

import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.repository.postgres.LeadRepository;
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
public class StaleLeadCleanupTask {

    private static final Logger log = LoggerFactory.getLogger(StaleLeadCleanupTask.class);
    private static final List<String> ACTIVE_STATUSES = List.of("new", "active", "in_progress");
    private static final int STALE_DAYS = 30;

    private final LeadRepository leadRepository;
    private final Counter staleLeadsMarkedCounter;

    public StaleLeadCleanupTask(LeadRepository leadRepository, MeterRegistry meterRegistry) {
        this.leadRepository = leadRepository;
        this.staleLeadsMarkedCounter = Counter.builder("crm.scheduler.stale_leads_marked")
                .description("Number of leads marked as stale by the cleanup task")
                .register(meterRegistry);
    }

    @Scheduled(cron = "${crm.scheduler.stale-lead-cleanup-cron:0 0 2 * * ?}")
    public void markStaleLeads() {
        log.info("Starting stale lead cleanup task");
        Instant cutoff = Instant.now().minus(STALE_DAYS, ChronoUnit.DAYS);

        List<LeadEntity> staleLeads = leadRepository.findStaleLeads(ACTIVE_STATUSES, cutoff);
        int count = 0;

        for (LeadEntity lead : staleLeads) {
            lead.setRagStatus("RED");
            lead.setStatus("stale");
            lead.setUpdatedAt(Instant.now());
            leadRepository.save(lead);
            count++;
        }

        staleLeadsMarkedCounter.increment(count);
        log.info("Stale lead cleanup complete: {} leads marked as stale", count);
    }
}
