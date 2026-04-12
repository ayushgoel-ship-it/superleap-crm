package com.cars24.crmcore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitListItem {

    private UUID visitId;
    private String dealerCode;
    private String dealerName;
    private String visitType;
    private String status;
    private Integer duration;
    private Boolean isProductive;
    private LocalDate visitDate;
    private Instant checkInAt;
}
