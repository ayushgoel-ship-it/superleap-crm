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
public class DealerListItem {

    private UUID dealerId;
    private String dealerCode;
    private String dealerName;
    private String city;
    private String region;
    private String segment;
    private String status;
    private String kamName;
    private boolean isTop;
    private Instant lastVisitDate;
    private Instant lastCallDate;
}
