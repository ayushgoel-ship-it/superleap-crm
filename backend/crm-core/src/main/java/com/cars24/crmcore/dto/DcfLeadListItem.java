package com.cars24.crmcore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DcfLeadListItem {

    private UUID id;
    private String dcfId;
    private String customerName;
    private String dealerCode;
    private String currentFunnel;
    private String currentSubStage;
    private String ragStatus;
    private BigDecimal loanAmount;
    private Instant createdAt;
}
