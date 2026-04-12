package com.cars24.crmcore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummary {

    private int totalDealers;
    private int activeDealers;
    private int totalLeads;
    private int openLeads;
    private int wonLeads;
    private int totalCalls;
    private int totalVisits;
    private int totalDcfLeads;
    private String period;
}
