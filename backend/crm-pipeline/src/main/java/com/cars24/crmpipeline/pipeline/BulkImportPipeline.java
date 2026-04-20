package com.cars24.crmpipeline.pipeline;

import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.internal.AsyncJobService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;

@Component
public class BulkImportPipeline {

    private final DealerRepository dealerRepository;
    private final UserRepository userRepository;
    private final AsyncJobService asyncJobService;

    public BulkImportPipeline(DealerRepository dealerRepository,
                               UserRepository userRepository,
                               AsyncJobService asyncJobService) {
        this.dealerRepository = dealerRepository;
        this.userRepository = userRepository;
        this.asyncJobService = asyncJobService;
    }

    @Async("crmAsyncExecutor")
    public void process(UUID jobId, String csvContent) {
        asyncJobService.markRunning(jobId);

        int totalRows = 0;
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        try {
            String[] lines = csvContent.split("\n");

            // Skip header row
            for (int i = 1; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;
                totalRows++;

                try {
                    String[] cols = line.split(",");
                    if (cols.length < 2) {
                        errors.add("Row " + (i + 1) + ": expected at least 2 columns (dealer_code, kam_user_id)");
                        continue;
                    }

                    String dealerCode = cols[0].trim();
                    String kamUserIdStr = cols[1].trim();

                    // Validate dealer exists
                    Optional<DealerEntity> dealerOpt = dealerRepository.findByDealerCode(dealerCode);
                    if (dealerOpt.isEmpty()) {
                        errors.add("Row " + (i + 1) + ": dealer not found: " + dealerCode);
                        continue;
                    }

                    // Validate KAM user exists
                    UUID kamUserId;
                    try {
                        kamUserId = UUID.fromString(kamUserIdStr);
                    } catch (IllegalArgumentException e) {
                        errors.add("Row " + (i + 1) + ": invalid UUID: " + kamUserIdStr);
                        continue;
                    }

                    Optional<UserEntity> userOpt = userRepository.findById(kamUserId);
                    if (userOpt.isEmpty()) {
                        errors.add("Row " + (i + 1) + ": user not found: " + kamUserId);
                        continue;
                    }

                    // Apply the mapping
                    DealerEntity dealer = dealerOpt.get();
                    dealer.setKamId(kamUserId);
                    dealer.setUpdatedAt(Instant.now());
                    dealerRepository.save(dealer);
                    successCount++;

                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }

            String resultSummary = String.format(
                    "{\"totalRows\":%d,\"successCount\":%d,\"errorCount\":%d,\"errors\":%s}",
                    totalRows, successCount, errors.size(), toJsonArray(errors));

            asyncJobService.markCompleted(jobId, resultSummary);

        } catch (Exception e) {
            asyncJobService.markFailed(jobId, "Pipeline error: " + e.getMessage());
        }
    }

    private String toJsonArray(List<String> items) {
        if (items.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(items.get(i).replace("\"", "\\\"")).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
}
