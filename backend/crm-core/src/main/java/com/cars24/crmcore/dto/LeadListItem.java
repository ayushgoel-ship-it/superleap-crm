package com.cars24.crmcore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadListItem {

    private UUID id;
    private String leadId;
    private String customerName;
    private String channel;
    private String stage;
    private String status;
    private String ragStatus;
    private String dealerCode;
    private String dealerName;
    private Instant createdAt;
    private Instant updatedAt;
}
