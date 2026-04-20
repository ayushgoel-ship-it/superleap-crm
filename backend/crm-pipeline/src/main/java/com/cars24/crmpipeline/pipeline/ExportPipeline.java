package com.cars24.crmpipeline.pipeline;

import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.repository.postgres.LeadRepository;
import com.cars24.crmcore.service.internal.AsyncJobService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class ExportPipeline {

    private final DealerRepository dealerRepository;
    private final LeadRepository leadRepository;
    private final AsyncJobService asyncJobService;

    public ExportPipeline(DealerRepository dealerRepository,
                           LeadRepository leadRepository,
                           AsyncJobService asyncJobService) {
        this.dealerRepository = dealerRepository;
        this.leadRepository = leadRepository;
        this.asyncJobService = asyncJobService;
    }

    @Async("crmAsyncExecutor")
    public void generate(UUID jobId, String exportType) {
        asyncJobService.markRunning(jobId);

        try {
            String csvContent;
            int rowCount;

            switch (exportType.toLowerCase()) {
                case "dealers" -> {
                    List<DealerEntity> dealers = dealerRepository.findAll();
                    csvContent = generateDealersCsv(dealers);
                    rowCount = dealers.size();
                }
                case "leads" -> {
                    List<LeadEntity> leads = leadRepository.findAll();
                    csvContent = generateLeadsCsv(leads);
                    rowCount = leads.size();
                }
                default -> {
                    asyncJobService.markFailed(jobId, "Unsupported export type: " + exportType);
                    return;
                }
            }

            String resultSummary = String.format(
                    "{\"exportType\":\"%s\",\"rowCount\":%d,\"csvLength\":%d}",
                    exportType, rowCount, csvContent.length());

            asyncJobService.markCompleted(jobId, resultSummary);

        } catch (Exception e) {
            asyncJobService.markFailed(jobId, "Export error: " + e.getMessage());
        }
    }

    private String generateDealersCsv(List<DealerEntity> dealers) {
        StringBuilder sb = new StringBuilder();
        sb.append("dealer_code,dealer_name,city,region,segment,status,kam_id,tl_id\n");
        for (DealerEntity d : dealers) {
            sb.append(csvEscape(d.getDealerCode())).append(",")
              .append(csvEscape(d.getDealerName())).append(",")
              .append(csvEscape(d.getCity())).append(",")
              .append(csvEscape(d.getRegion())).append(",")
              .append(csvEscape(d.getSegment())).append(",")
              .append(csvEscape(d.getStatus())).append(",")
              .append(d.getKamId() != null ? d.getKamId() : "").append(",")
              .append(d.getTlId() != null ? d.getTlId() : "")
              .append("\n");
        }
        return sb.toString();
    }

    private String generateLeadsCsv(List<LeadEntity> leads) {
        StringBuilder sb = new StringBuilder();
        sb.append("lead_id,dealer_code,customer_name,customer_phone,status,stage,channel\n");
        for (LeadEntity l : leads) {
            sb.append(csvEscape(l.getLeadId())).append(",")
              .append(csvEscape(l.getDealerCode())).append(",")
              .append(csvEscape(l.getCustomerName())).append(",")
              .append(csvEscape(l.getCustomerPhone())).append(",")
              .append(csvEscape(l.getStatus())).append(",")
              .append(csvEscape(l.getStage())).append(",")
              .append(csvEscape(l.getChannel()))
              .append("\n");
        }
        return sb.toString();
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
