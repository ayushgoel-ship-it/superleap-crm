package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.DashboardSummary;
import com.cars24.crmcore.repository.postgres.*;
import com.cars24.crmcore.service.internal.DashboardQueryService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
public class DashboardQueryServiceImpl implements DashboardQueryService {

    private final DealerRepository dealerRepository;
    private final LeadRepository leadRepository;
    private final DcfLeadRepository dcfLeadRepository;
    private final CallEventRepository callEventRepository;
    private final VisitRepository visitRepository;

    public DashboardQueryServiceImpl(DealerRepository dealerRepository,
                                     LeadRepository leadRepository,
                                     DcfLeadRepository dcfLeadRepository,
                                     CallEventRepository callEventRepository,
                                     VisitRepository visitRepository) {
        this.dealerRepository = dealerRepository;
        this.leadRepository = leadRepository;
        this.dcfLeadRepository = dcfLeadRepository;
        this.callEventRepository = callEventRepository;
        this.visitRepository = visitRepository;
    }

    @Override
    public DashboardSummary getDashboardSummary(UUID userId, String role) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        Instant periodStart = startOfMonth.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant periodEnd = Instant.now();

        long totalDealers = dealerRepository.count();
        long totalLeads = leadRepository.count();
        long totalDcfLeads = dcfLeadRepository.count();
        long totalCalls = (userId != null)
                ? callEventRepository.countByKamIdBetweenDates(userId, periodStart, periodEnd)
                : callEventRepository.count();
        long totalVisits = (userId != null)
                ? visitRepository.countByKamIdBetweenDates(userId, periodStart, periodEnd)
                : visitRepository.count();

        return DashboardSummary.builder()
                .totalDealers((int) totalDealers)
                .totalLeads((int) totalLeads)
                .totalDcfLeads((int) totalDcfLeads)
                .totalCalls((int) totalCalls)
                .totalVisits((int) totalVisits)
                .period(startOfMonth + " to " + today)
                .build();
    }
}
