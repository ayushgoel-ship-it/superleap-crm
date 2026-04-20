package com.cars24.crmapi.scheduler;

import com.cars24.crmcore.entity.TargetEntity;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.repository.postgres.TargetRepository;
import com.cars24.crmcore.repository.postgres.UserRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class MonthlyTargetInitTask {

    private static final Logger log = LoggerFactory.getLogger(MonthlyTargetInitTask.class);
    private static final DateTimeFormatter PERIOD_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final UserRepository userRepository;
    private final TargetRepository targetRepository;
    private final Counter targetsCreatedCounter;

    public MonthlyTargetInitTask(UserRepository userRepository,
                                 TargetRepository targetRepository,
                                 MeterRegistry meterRegistry) {
        this.userRepository = userRepository;
        this.targetRepository = targetRepository;
        this.targetsCreatedCounter = Counter.builder("crm.scheduler.targets_initialized")
                .description("Number of target records created by monthly init task")
                .register(meterRegistry);
    }

    @Scheduled(cron = "${crm.scheduler.monthly-target-init-cron:0 0 1 1 * ?}")
    public void initializeMonthlyTargets() {
        String nextPeriod = YearMonth.now().plusMonths(1).format(PERIOD_FORMAT);
        log.info("Starting monthly target initialization for period: {}", nextPeriod);

        List<TargetEntity> existing = targetRepository.findByPeriod(nextPeriod);
        if (!existing.isEmpty()) {
            log.info("Targets already exist for period {}: {} records, skipping", nextPeriod, existing.size());
            return;
        }

        List<UserEntity> activeUsers = userRepository.findByActiveTrue();
        int count = 0;

        for (UserEntity user : activeUsers) {
            if (!"KAM".equalsIgnoreCase(user.getRole())) {
                continue;
            }

            TargetEntity target = new TargetEntity();
            target.setUserId(user.getUserId().toString());
            target.setUserName(user.getName());
            target.setTeamId(user.getTeamId() != null ? user.getTeamId().toString() : null);
            target.setRole(user.getRole());
            target.setPeriod(nextPeriod);
            target.setSiTarget(0);
            target.setCallTarget(0);
            target.setVisitTarget(0);
            target.setDcfLeadsTarget(0);
            target.setDcfDisbursalTarget(0);
            target.setCreatedAt(Instant.now());
            target.setUpdatedAt(Instant.now());

            targetRepository.save(target);
            count++;
        }

        targetsCreatedCounter.increment(count);
        log.info("Monthly target initialization complete: {} targets created for period {}", count, nextPeriod);
    }
}
